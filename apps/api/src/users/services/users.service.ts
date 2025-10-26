import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { FindAllUsersDto } from '../dto/find-all-users.dto';

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
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<Usuario> {
    // 1. Verifica si el email ya existe
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está en uso.');
    }

    // 2. Hashea la contraseña antes de guardarla
    createUserDto.password = await bcrypt.hash(
      createUserDto.password,
      +process.env.HASH_SALT,
    );

    // 3. Crea el usuario con la contraseña hasheada
    return await this.prisma.usuario.create({
      data: {
        ...createUserDto,
      },
    });
  }

  async findAll(query: FindAllUsersDto): Promise<PaginatedUsersResponse> {
    const {
      page = 1,
      limit = 6, // Asegúrate que este '6' coincida con el default de tu DTO
      sort = 'apellido',
      order = 'asc',
      search,
      roles,
      estado,
    } = query;

    // --- 1. Calcular Paginación ---
    const skip = (page - 1) * limit;
    const take = limit;

    // --- 2. Construir el WHERE dinámico ---
    const where: Prisma.UsuarioWhereInput = {
      // No filtramos por deletedAt por defecto,
      // lo dejamos en manos del filtro 'estado'.
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
      // El DTO ya validó que 'roles' es un array de Enum Rol
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
          // ¡Importante! No devuelvas la contraseña
          select: {
            id: true,
            email: true,
            nombre: true,
            apellido: true,
            dni: true,
            fechaNacimiento: true,
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
      // Manejar errores de Prisma (ej: si 'sort' no es un campo válido)
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(`Error en la consulta: ${e.message}`);
      }
      throw new BadRequestException('Error al consultar los usuarios');
    }
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Si se está actualizando la contraseña, también la hasheamos
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    return this.prisma.usuario.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async delete(id: string) {
    // Verificamos que el usuario exista para no intentar borrar algo que no está.
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario || usuario.deletedAt) {
      // Si no se encuentra o ya está borrado, lanzamos un error.
      throw new NotFoundException(
        `Usuario con ID '${id}' no encontrado o ya ha sido eliminado.`,
      );
    }

    // Si existe, actualizamos el campo 'deletedAt' con la fecha y hora actual.
    return this.prisma.usuario.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
