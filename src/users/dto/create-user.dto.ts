import { ApiProperty } from "@nestjs/swagger"
import { Role } from "@prisma/client"
import { Transform } from "class-transformer"
import { IsEmail, IsEnum, IsString, MinLength } from "class-validator"

export class CreateUserDto {
    
    @ApiProperty({required: true})
    @IsEmail()
    email: string

    @ApiProperty({required: true})
    @IsString()
    @MinLength(1)
    firstName: string

    @ApiProperty({required: true})
    @IsString()
    @MinLength(1)
    lastName: string

    @ApiProperty({required: true})
    @Transform(({ value }) => value.trim())
    @IsString()
    @MinLength(6)
    password: string
      
    @ApiProperty({required: true})
    @IsEnum(Role)
    role: Role

}
