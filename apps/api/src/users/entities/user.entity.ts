import { ApiProperty } from '@nestjs/swagger';
import { Rol } from '@prisma/client';
export class UserEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  apellido: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;

  @ApiProperty()
  rol: Rol;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
