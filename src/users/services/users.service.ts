import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // 1. Verifica si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está en uso.');
    }

    // 2. Hashea la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 3. Crea el usuario con la contraseña hasheada
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
  }

  async findAll() {
    // Devuelve solo los usuarios que no han sido borrados lógicamente
    return this.prisma.user.findMany({
      where: { deletedAt: null },
    });
  }

  async findOne(id: string) {
    // Busca un usuario por ID que no haya sido borrado
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID '${id}' no encontrado.`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Si se está actualizando la contraseña, también la hasheamos
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    // Implementa el borrado lógico actualizando el campo 'deletedAt'
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
