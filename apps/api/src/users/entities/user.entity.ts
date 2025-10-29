import { ApiProperty } from '@nestjs/swagger';
import { roles } from '@prisma/client';
export class UserEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  apellido: string;

  @ApiProperty()
  dni: string;

  @ApiProperty()
  fechaNacimiento: Date;

  @ApiProperty()
  genero: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;

  @ApiProperty()
  rol: roles;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt?: Date;
}
