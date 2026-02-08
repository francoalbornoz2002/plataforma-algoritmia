import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Valida si un docente tiene acceso a un curso.
 * Regla: Debe estar 'Activo' en la relación, O el curso debe estar finalizado (Historial).
 */
export async function checkDocenteAccess(
  tx: PrismaService | Prisma.TransactionClient,
  idDocente: string,
  idCurso: string,
) {
  const asignacion = await (tx as PrismaService).docenteCurso.findUnique({
    where: {
      idDocente_idCurso: {
        idDocente,
        idCurso,
      },
    },
    include: { curso: { select: { deletedAt: true } } },
  });

  if (!asignacion) {
    throw new ForbiddenException(
      'No tienes permiso para acceder a este curso.',
    );
  }

  // Permitir acceso si está Activo O si el curso está finalizado (Historial)
  if (asignacion.estado !== 'Activo' && !asignacion.curso.deletedAt) {
    throw new ForbiddenException(
      'No tienes permiso para acceder a este curso (Asignación inactiva).',
    );
  }
}

/**
 * Valida si un alumno tiene acceso a un curso.
 * Regla: Debe estar 'Activo' en la relación, O el curso debe estar finalizado (Historial).
 */
export async function checkAlumnoAccess(
  tx: PrismaService | Prisma.TransactionClient,
  idAlumno: string,
  idCurso: string,
) {
  const inscripcion = await (tx as PrismaService).alumnoCurso.findUnique({
    where: {
      idAlumno_idCurso: {
        idAlumno,
        idCurso,
      },
    },
    include: { curso: { select: { deletedAt: true } } },
  });

  if (!inscripcion) {
    throw new ForbiddenException('El alumno no pertenece a este curso.');
  }

  // Permitir acceso si está Activo O si el curso está finalizado (Historial)
  if (inscripcion.estado !== 'Activo' && !inscripcion.curso.deletedAt) {
    throw new ForbiddenException('El alumno no está activo en este curso.');
  }
}
