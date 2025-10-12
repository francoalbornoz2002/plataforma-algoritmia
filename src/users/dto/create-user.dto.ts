import { Role } from "@prisma/client"
import { Transform } from "class-transformer"
import { IsEmail, IsEnum, IsString, MinLength } from "class-validator"

export class CreateUserDto {

    @IsEmail()
    email: string

    @IsString()
    @MinLength(1)
    firstName: string

    @IsString()
    @MinLength(1)
    lastName: string

    @Transform(({ value }) => value.trim())
    @IsString()
    @MinLength(6)
    password: string

    @IsEnum(Role)
    role: Role

}
