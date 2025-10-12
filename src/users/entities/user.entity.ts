import { ApiProperty } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';

type UserWithoutPassword = Omit<User, 'password'>;
export class UserEntity implements UserWithoutPassword {
  
    @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  role: Role;
}
