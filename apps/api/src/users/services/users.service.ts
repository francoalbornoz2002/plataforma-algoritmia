import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Prisma,
  roles,
  Usuario,
  estado_clase_consulta,
  estado_consulta,
  estado_sesion,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { FindAllUsersDto } from '../dto/find-all-users.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { MailService } from 'src/mail/services/mail.service';
import { unlink } from 'fs';
import { basename, join } from 'path';
import { ProgressService } from 'src/progress/services/progress.service';
import { DifficultiesService } from 'src/difficulties/services/difficulties.service';

// Defino el tipo de usuario sin password a devolver
type SafeUser = Omit<Usuario, 'password'>;

// Defino la estructura del objeto que vas a devolver en findAll
export interface PaginatedUsersResponse {
  data: SafeUser[]; // O puedes usar 'any[]' si no quieres ser tan estricto
  total: number;
  page: number;
  totalPages: number;
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly progressService: ProgressService,
    private readonly difficultiesService: DifficultiesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Usuario> {
    const { password, email, nombre, dni, ...resto } = createUserDto;

    // 1. Verifica si el email o dni ya existen en los usuarios registrados
    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ email: email }, { dni: dni }],
      },
    });
    if (existingUser) {
      if (existingUser.dni === dni) {
        throw new ConflictException('El DNI ya está registrado.');
      } else {
        throw new ConflictException('El correo electrónico ya está en uso.');
      }
    }

    // 2. Hashea la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, +process.env.HASH_SALT);

    // 3. Guardar usuario en la Base de Datos
    const nuevoUsuario = await this.prisma.usuario.create({
      data: {
        email,
        nombre,
        password: hashedPassword,
        dni,
        ...resto,
      },
    });

    // 4. Enviar correo de bienvenida (INTENTO SEGURO)
    try {
      // Pasamos la contraseña original sin hashear
      await this.mailService.enviarBienvenida(email, nombre, password);
      console.log(`📧 Correo enviado exitosamente a ${email}`);
    } catch (emailError) {
      // Si falla el correo, NO fallamos el registro del usuario.
      // Solo lo registramos en la consola para revisarlo.
      console.error('❌ Error enviando correo de bienvenida:', emailError);
    }

    return nuevoUsuario;
  }

  async findAll(
    dto: FindAllUsersDto,
    adminIdToExclude: string,
  ): Promise<PaginatedUsersResponse> {
    const {
      page = 1,
      limit = 6, // Asegúrate que este '6' coincida con el default de tu DTO
      sort = 'apellido',
      order = 'asc',
      search,
      roles,
      estado,
    } = dto;

    // --- 1. Calcular Paginación ---
    const skip = (page - 1) * limit;
    const take = limit;

    // --- 2. Construir el WHERE dinámico ---
    const where: Prisma.UsuarioWhereInput = {
      id: {
        not: adminIdToExclude,
      },
    };

    // Filtro de Búsqueda (Nombre, Apellido, Email, DNI)
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { dni: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtro de Roles (Múltiple)
    if (roles && roles.length > 0) {
      // El DTO ya validó que 'roles' es un array de Enum roles
      where.rol = { in: roles };
    }

    // Filtro de Estado ("true", "false", o ""/undefined)
    if (estado === 'true') {
      where.deletedAt = null; // Solo Activos
    } else if (estado === 'false') {
      where.deletedAt = { not: null }; // Solo Inactivos
    }
    // Si 'estado' es "" o undefined (Todos), no se añade ningún filtro de deletedAt

    // --- 3. Construir el ORDER BY dinámico ---
    // (Por seguridad, puedes validar que 'sort' sea un campo permitido)
    const validSortFields = [
      'nombre',
      'apellido',
      'dni',
      'email',
      'rol',
      'fechaNacimiento',
      'deletedAt',
      'createdAt',
    ];

    const finalSort = validSortFields.includes(sort) ? sort : 'apellido';
    const orderBy = { [finalSort]: order };

    // --- 4. Ejecutar las consultas en una transacción ---
    try {
      const [users, total] = await this.prisma.$transaction([
        // Consulta 1: Obtener los datos de la página
        this.prisma.usuario.findMany({
          where,
          skip,
          take,
          orderBy,
          // No devolvemos la contraseña
          select: {
            id: true,
            email: true,
            nombre: true,
            apellido: true,
            dni: true,
            fechaNacimiento: true,
            genero: true,
            rol: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
        }),
        // Consulta 2: Obtener el conteo total (con los mismos filtros)
        this.prisma.usuario.count({
          where,
        }),
      ]);

      // --- 5. Devolver el objeto esperado por el frontend ---
      return {
        data: users,
        total: total,
        page: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (e) {
      // Manejar errores de Prisma
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(`Error en la consulta: ${e.message}`);
      }
      throw new BadRequestException('Error al consultar los usuarios');
    }
  }

  async findTeachers() {
    return this.prisma.usuario.findMany({
      where: {
        rol: roles.Docente,
        deletedAt: null, // Solo docentes activos
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
      },
    });
  }

  async findOne(id: string): Promise<Usuario> {
    // Busca un usuario por ID que no haya sido borrado
    const usuario = await this.prisma.usuario.findUnique({
      where: { id, deletedAt: null },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID '${id}' no encontrado.`);
    }

    return usuario;
  }

  async findAlumnoForGame(dto: LoginDto) {
    // Realizamos desestructuración del dto
    const { email, password } = dto;

    // Validamos que el usuario (alumno) exista y esté activo.
    const alumno = await this.prisma.usuario.findUnique({
      where: { email },
    });

    // Si está inactivo, lanzamos error
    if (alumno?.deletedAt) {
      throw new UnauthorizedException('Este usuario está inactivo.');
    }

    // Si no es un alumno, lanzamos error
    if (alumno?.rol !== roles.Alumno) {
      throw new ForbiddenException(
        'Acceso denegado. Solo los alumnos pueden jugar.',
      );
    }

    // Si no se encuentra o la contraseña es incorrecta, lanzamos error
    if (!alumno || !(await bcrypt.compare(password, alumno.password))) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // Obtenemos la inscripción activa del alumno
    const inscripcion = await this.prisma.alumnoCurso.findFirst({
      where: {
        idAlumno: alumno.id,
        estado: 'Activo',
      },
      select: {
        idCurso: true,
        idProgreso: true,
      },
    });

    // Si no existe una inscripción activa, lazamos error.
    if (!inscripcion) {
      throw new NotFoundException(
        'Este alumno no tiene una inscripción activa.',
      );
    }

    const { idCurso, idProgreso } = inscripcion;

    // Obtenemos el progreso_alumno para obtener la última actividad
    const progreso = await this.prisma.progresoAlumno.findUnique({
      where: { id: idProgreso },
      select: { ultimaActividad: true },
    });

    // Si no existe el progreso, lanzamos error
    if (!progreso) {
      throw new NotFoundException(
        'No se encontró el registro de progreso del alumno.',
      );
    }

    // Obtenemos las misiones completadas por el alumno en ese progreso
    const misionesCompletadas = await this.prisma.misionCompletada.findMany({
      where: { idProgreso: idProgreso },
      select: {
        // Devolvemos solo lo que Godot necesita guardar
        idMision: true,
        estrellas: true,
        exp: true,
        intentos: true,
        fechaCompletado: true,
      },
    });

    // Obtenemos las dificultades registradas por el alumno en ese curso
    const dificultadesAlumno = await this.prisma.dificultadAlumno.findMany({
      where: {
        idAlumno: alumno.id,
        idCurso: idCurso,
      },
      select: {
        // Devolvemos solo lo que Godot necesita
        idDificultad: true,
        grado: true,
      },
    });

    // Armamos y devolvemos la respuesta final
    const alumnoData = {
      id: alumno.id,
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      genero: alumno.genero,
      ultimaActividad: progreso.ultimaActividad,
    };

    return {
      alumno: alumnoData,
      misionesCompletadas: misionesCompletadas,
      dificultadesAlumno: dificultadesAlumno,
    };
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    fotoPerfil?: Express.Multer.File,
  ) {
    // 0. Obtener el usuario actual para verificar cambios de rol
    const usuarioActual = await this.prisma.usuario.findUnique({
      where: { id },
      select: { rol: true, fotoPerfilUrl: true },
    });
    if (!usuarioActual) throw new NotFoundException('Usuario no encontrado');

    // 1. Verificar si el usuario existe para obtener su foto actual (si vamos a cambiarla)
    let oldFotoUrl: string | null = null;
    if (fotoPerfil) {
      const usuarioActual = await this.prisma.usuario.findUnique({
        where: { id },
        select: { fotoPerfilUrl: true },
      });
      if (usuarioActual) {
        oldFotoUrl = usuarioActual.fotoPerfilUrl;
      }
    }

    // Si se está actualizando la contraseña, también la hasheamos
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Preparamos los datos a actualizar
    const dataToUpdate: any = { ...updateUserDto };

    if (fotoPerfil && fotoPerfil.filename) {
      dataToUpdate.fotoPerfilUrl = `/uploads/${fotoPerfil.filename}`;
    }

    // Ejecutamos la actualización dentro de una transacción para manejar el cambio de rol
    const usuarioActualizado = await this.prisma.$transaction(async (tx) => {
      // Si el rol cambia, limpiamos las dependencias del rol anterior
      if (updateUserDto.rol && updateUserDto.rol !== usuarioActual.rol) {
        await this.cleanupUserDependencies(tx, id, usuarioActual.rol);
      }

      // Actualizamos el usuario
      return tx.usuario.update({
        where: { id },
        data: dataToUpdate,
      });
    });

    // Si se subió una nueva foto y existía una anterior, borramos la vieja del disco
    if (fotoPerfil && oldFotoUrl) {
      const oldFileName = basename(oldFotoUrl);
      const UPLOADS_PATH = join(process.cwd(), 'uploads');
      const oldImagePath = join(UPLOADS_PATH, oldFileName);

      unlink(oldImagePath, (err) => {
        if (err) console.error(`Error eliminando foto antigua: ${err.message}`);
      });
    }

    return usuarioActualizado;
  }

  async delete(id: string) {
    // Verificamos que el usuario exista para no intentar borrar algo que no está.
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario || usuario.deletedAt) {
      // Si no se encuentra o ya está borrado, lanzamos un error.
      throw new NotFoundException(
        `Usuario con ID '${id}' no encontrado o ya ha sido dado de baja.`,
      );
    }

    // Ejecutamos la baja en una transacción para asegurar integridad
    return this.prisma.$transaction(async (tx) => {
      // 1. Limpiar dependencias según el rol actual
      await this.cleanupUserDependencies(tx, id, usuario.rol);

      // --- BAJA DEL USUARIO ---
      return tx.usuario.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });
    });
  }

  /**
   * Helper privado para limpiar dependencias de un usuario según su rol.
   * Se usa tanto al eliminar un usuario como al cambiar su rol.
   */
  private async cleanupUserDependencies(
    tx: Prisma.TransactionClient,
    userId: string,
    role: roles,
  ) {
    // --- LÓGICA PARA ALUMNOS ---
    if (role === roles.Alumno) {
      // 1. Buscar SOLO la inscripción activa (Regla de Negocio 1)
      const inscripcionActiva = await tx.alumnoCurso.findFirst({
        where: {
          idAlumno: userId,
          estado: 'Activo',
        },
      });

      if (inscripcionActiva) {
        // 2. Dar de baja la inscripción
        await tx.alumnoCurso.update({
          where: {
            idAlumno_idCurso: {
              idAlumno: userId,
              idCurso: inscripcionActiva.idCurso,
            },
          },
          data: { estado: 'Inactivo', fechaBaja: new Date() },
        });

        // 3. Dar de baja el progreso
        await tx.progresoAlumno.update({
          where: { id: inscripcionActiva.idProgreso },
          data: { estado: 'Inactivo' },
        });

        // 4. Recalcular estadísticas SOLO de ese curso
        await this.progressService.recalculateCourseProgress(
          tx,
          inscripcionActiva.idCurso,
        );
        await this.difficultiesService.recalculateCourseDifficulties(
          tx,
          inscripcionActiva.idCurso,
        );
      }

      // 5. Cancelar todas las sesiones de refuerzo pendientes del alumno
      await tx.sesionRefuerzo.updateMany({
        where: {
          idAlumno: userId,
          estado: estado_sesion.Pendiente,
          deletedAt: null,
        },
        data: {
          estado: estado_sesion.Cancelada,
          deletedAt: new Date(),
        },
      });
    }

    // --- LÓGICA PARA DOCENTES ---
    if (role === roles.Docente) {
      // 1. Dar de baja asignaciones a cursos
      await tx.docenteCurso.updateMany({
        where: { idDocente: userId, estado: 'Activo' },
        data: { estado: 'Inactivo', fechaBaja: new Date() },
      });

      // 2. Gestionar Clases de Consulta
      const clasesACargo = await tx.claseConsulta.findMany({
        where: { idDocente: userId, deletedAt: null },
        include: { consultasEnClase: true },
      });

      for (const clase of clasesACargo) {
        let nuevoEstado: estado_clase_consulta | null = null;

        if (clase.estadoClase === estado_clase_consulta.Programada) {
          nuevoEstado = estado_clase_consulta.Pendiente_Asignacion;
        } else if (
          clase.estadoClase === estado_clase_consulta.En_curso ||
          clase.estadoClase === estado_clase_consulta.Finalizada
        ) {
          nuevoEstado = estado_clase_consulta.Cancelada;
        }

        if (nuevoEstado) {
          // Actualizar clase (y desvincular docente si pasa a Pendiente)
          await tx.claseConsulta.update({
            where: { id: clase.id },
            data: {
              estadoClase: nuevoEstado,
              idDocente:
                nuevoEstado === estado_clase_consulta.Pendiente_Asignacion
                  ? null
                  : clase.idDocente,
            },
          });

          // Devolver consultas a estado Pendiente (Regla de Negocio 2)
          const idsConsultas = clase.consultasEnClase.map((c) => c.idConsulta);
          if (idsConsultas.length > 0) {
            await tx.consulta.updateMany({
              where: { id: { in: idsConsultas } },
              data: { estado: estado_consulta.Pendiente },
            });
          }
        }
      }
    }
  }
}
