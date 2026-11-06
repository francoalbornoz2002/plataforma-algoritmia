import {
  Body,
  Controller,
  Get,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DocentesService } from '../services/docentes.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { roles } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { AuthenticatedUserRequest } from 'src/interfaces/authenticated-user.interface';
import { FindConsultasDto } from 'src/consultas/dto/find-consultas.dto';
import { CreateRespuestaDto } from 'src/consultas/dto/create-respuesta.dto';
import { ConsultasService } from 'src/consultas/services/consultas.service';

@UseGuards(RolesGuard)
//TODO: Quitar alumno de aqui si ya no es necesario, pero permitimos Administrador para visualización de reportes
@Roles(roles.Docente, roles.Alumno, roles.Administrador)
@Controller('docentes')
export class DocentesController {
  constructor(
    private readonly docentesService: DocentesService,
    private readonly consultasService: ConsultasService,
  ) {}

  @Post('my/consults/:idConsulta/respond')
  createRespuesta(
    @Param('idConsulta', ParseUUIDPipe) idConsulta: string,
    @Req() req: AuthenticatedUserRequest,
    @Body() dto: CreateRespuestaDto, // <-- 4. Usar el DTO de respuesta
  ) {
    const idDocente = req.user.userId;
    return this.docentesService.createRespuesta(idConsulta, idDocente, dto);
  }

  @Get('my/courses/:idCurso/active-docentes')
  getActiveDocentes(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const { userId, rol } = req.user;
    return this.docentesService.findActiveDocentesByCurso(idCurso, userId, rol);
  }

  // --- ¡NUEVO ENDPOINT 2! ---
  @Get('my/courses/:idCurso/pending-consultas')
  getPendingConsultas(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId;
    return this.consultasService.findPendingConsultasByCurso(idCurso);
  }

  @Delete('my/courses/:idCurso/students/:idAlumno')
  removeStudent(
    @Param('idCurso', ParseUUIDPipe) idCurso: string,
    @Param('idAlumno', ParseUUIDPipe) idAlumno: string,
    @Req() req: AuthenticatedUserRequest,
  ) {
    const idDocente = req.user.userId;
    return this.docentesService.removeStudentFromCourse(
      idCurso,
      idAlumno,
      idDocente,
    );
  }
}
