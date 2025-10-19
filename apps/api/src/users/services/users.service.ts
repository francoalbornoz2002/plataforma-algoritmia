import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 3. Crea el usuario con la contraseña hasheada
    return this.prisma.usuario.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
  }

  async findAll(): Promise<Usuario[]> {
    // Devuelve solo los usuarios que no han sido borrados lógicamente
    const users = await this.prisma.usuario.findMany({
      where: { deletedAt: null },
    });
    return users;
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

  async remove(id: string) {
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
