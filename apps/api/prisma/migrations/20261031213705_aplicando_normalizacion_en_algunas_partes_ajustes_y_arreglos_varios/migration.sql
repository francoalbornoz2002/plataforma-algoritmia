/*
  Warnings:

  - You are about to drop the column `id_dificultades_curso` on the `cursos` table. All the data in the column will be lost.
  - You are about to drop the column `id_progreso` on the `cursos` table. All the data in the column will be lost.
  - The primary key for the `misiones_completadas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_progreso` on the `misiones_completadas` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `progreso_alumno` table. All the data in the column will be lost.
  - You are about to drop the column `ultima_actividad` on the `progreso_alumno` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `progreso_curso` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_nacimiento` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `genero` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the `alumno_curso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dificultad_alumno` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `docente_curso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `historial_dificultades_alumno` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `historial_dificultades_curso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `historial_progreso_alumno` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `historial_progreso_curso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mision_especial_completada` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `id_curso` to the `dificultades_curso` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `misiones_completadas` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `id_inscripcion` to the `misiones_completadas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_inscripcion` to the `progreso_alumno` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_curso` to the `progreso_curso` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "alumno_curso" DROP CONSTRAINT "alumno_curso_id_alumno_fkey";

-- DropForeignKey
ALTER TABLE "alumno_curso" DROP CONSTRAINT "alumno_curso_id_curso_fkey";

-- DropForeignKey
ALTER TABLE "alumno_curso" DROP CONSTRAINT "alumno_curso_id_progreso_fkey";

-- DropForeignKey
ALTER TABLE "cursos" DROP CONSTRAINT "cursos_id_dificultades_curso_fkey";

-- DropForeignKey
ALTER TABLE "cursos" DROP CONSTRAINT "cursos_id_progreso_fkey";

-- DropForeignKey
ALTER TABLE "dificultad_alumno" DROP CONSTRAINT "dificultad_alumno_id_alumno_fkey";

-- DropForeignKey
ALTER TABLE "dificultad_alumno" DROP CONSTRAINT "dificultad_alumno_id_curso_fkey";

-- DropForeignKey
ALTER TABLE "dificultad_alumno" DROP CONSTRAINT "dificultad_alumno_id_dificultad_fkey";

-- DropForeignKey
ALTER TABLE "docente_curso" DROP CONSTRAINT "docente_curso_id_curso_fkey";

-- DropForeignKey
ALTER TABLE "docente_curso" DROP CONSTRAINT "docente_curso_id_docente_fkey";

-- DropForeignKey
ALTER TABLE "historial_dificultades_alumno" DROP CONSTRAINT "historial_dificultades_alumno_id_alumno_fkey";

-- DropForeignKey
ALTER TABLE "historial_dificultades_alumno" DROP CONSTRAINT "historial_dificultades_alumno_id_curso_fkey";

-- DropForeignKey
ALTER TABLE "historial_dificultades_alumno" DROP CONSTRAINT "historial_dificultades_alumno_id_dificultad_fkey";

-- DropForeignKey
ALTER TABLE "historial_dificultades_curso" DROP CONSTRAINT "historial_dificultades_curso_id_dificultades_curso_fkey";

-- DropForeignKey
ALTER TABLE "historial_progreso_alumno" DROP CONSTRAINT "historial_progreso_alumno_id_progreso_fkey";

-- DropForeignKey
ALTER TABLE "historial_progreso_curso" DROP CONSTRAINT "historial_progreso_curso_id_progreso_curso_fkey";

-- DropForeignKey
ALTER TABLE "mision_especial_completada" DROP CONSTRAINT "mision_especial_completada_id_progreso_fkey";

-- DropForeignKey
ALTER TABLE "misiones_completadas" DROP CONSTRAINT "misiones_completadas_id_progreso_fkey";

-- DropIndex
DROP INDEX "idx_cursos_dificultad";

-- DropIndex
DROP INDEX "idx_cursos_progreso";

-- DropIndex
DROP INDEX "idx_misiones_completadas_pks";

-- DropIndex
DROP INDEX "idx_progreso_alumno_actividad";

-- DropIndex
DROP INDEX "idx_progreso_alumno_estado";

-- DropIndex
DROP INDEX "idx_progreso_curso_estado";

-- AlterTable
ALTER TABLE "cursos" DROP COLUMN "id_dificultades_curso",
DROP COLUMN "id_progreso";

-- AlterTable
ALTER TABLE "dificultades_curso" ADD COLUMN     "fecha_registro" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id_curso" UUID NOT NULL;

-- AlterTable
ALTER TABLE "misiones_completadas" DROP CONSTRAINT "misiones_completadas_pkey",
DROP COLUMN "id_progreso",
ADD COLUMN     "id" UUID NOT NULL,
ADD COLUMN     "id_inscripcion" UUID NOT NULL,
ADD CONSTRAINT "misiones_completadas_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "progreso_alumno" DROP COLUMN "estado",
DROP COLUMN "ultima_actividad",
ADD COLUMN     "fecha_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id_inscripcion" UUID NOT NULL;

-- AlterTable
ALTER TABLE "progreso_curso" DROP COLUMN "estado",
ADD COLUMN     "fecha_registro" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id_curso" UUID NOT NULL;

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "fecha_nacimiento",
DROP COLUMN "genero";

-- DropTable
DROP TABLE "alumno_curso";

-- DropTable
DROP TABLE "dificultad_alumno";

-- DropTable
DROP TABLE "docente_curso";

-- DropTable
DROP TABLE "historial_dificultades_alumno";

-- DropTable
DROP TABLE "historial_dificultades_curso";

-- DropTable
DROP TABLE "historial_progreso_alumno";

-- DropTable
DROP TABLE "historial_progreso_curso";

-- DropTable
DROP TABLE "mision_especial_completada";

-- DropEnum
DROP TYPE "generos";

-- CreateTable
CREATE TABLE "inscripciones_alumno_curso" (
    "id" UUID NOT NULL,
    "id_alumno" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "estado" "estado_simple" NOT NULL,
    "fecha_inscripcion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_baja" TIMESTAMPTZ(6),

    CONSTRAINT "inscripciones_alumno_curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dificultades_alumno" (
    "id" UUID NOT NULL,
    "id_inscripcion" UUID NOT NULL,
    "id_dificultad" UUID NOT NULL,
    "grado_anterior" "grado_dificultad" NOT NULL DEFAULT 'Ninguno',
    "grado_actual" "grado_dificultad" NOT NULL,
    "fecha_registro" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dificultades_alumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_docente_curso" (
    "id" UUID NOT NULL,
    "id_docente" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "estado" "estado_simple" NOT NULL,
    "fecha_asignacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_baja" TIMESTAMPTZ(6),

    CONSTRAINT "asignaciones_docente_curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "misiones_especial_completada" (
    "id" UUID NOT NULL,
    "id_inscripcion" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estrellas" SMALLINT NOT NULL,
    "exp" SMALLINT NOT NULL,
    "intentos" SMALLINT NOT NULL,
    "fecha_completado" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "misiones_especial_completada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_inscripciones_pk" ON "inscripciones_alumno_curso"("id");

-- CreateIndex
CREATE INDEX "idx_alumno_curso" ON "inscripciones_alumno_curso"("id_alumno", "id_curso");

-- CreateIndex
CREATE INDEX "idx_alumno_curso_estado" ON "inscripciones_alumno_curso"("estado");

-- CreateIndex
CREATE INDEX "idx_dificultades_alumno_inscripcion" ON "dificultades_alumno"("id_inscripcion", "id_dificultad");

-- CreateIndex
CREATE INDEX "idx_dificultad_alumno_c_d_g" ON "dificultades_alumno"("id_inscripcion", "id_dificultad", "grado_actual");

-- CreateIndex
CREATE INDEX "idx_dificultad_alumno_difgrado" ON "dificultades_alumno"("id_dificultad", "grado_actual");

-- CreateIndex
CREATE INDEX "idx_dificultad_alumno_grado" ON "dificultades_alumno"("grado_actual");

-- CreateIndex
CREATE INDEX "idx_asignaciones_pk" ON "asignaciones_docente_curso"("id");

-- CreateIndex
CREATE INDEX "idx_docente_curso" ON "asignaciones_docente_curso"("id_docente", "id_curso");

-- CreateIndex
CREATE INDEX "idx_docente_curso_estado" ON "asignaciones_docente_curso"("estado");

-- CreateIndex
CREATE INDEX "idx_misiones_especiales_inscripcion" ON "misiones_especial_completada"("id_inscripcion");

-- CreateIndex
CREATE INDEX "idx_mision_especial_fecha" ON "misiones_especial_completada"("fecha_completado");

-- CreateIndex
CREATE INDEX "idx_dificultades_curso_id_curso" ON "dificultades_curso"("id_curso");

-- CreateIndex
CREATE INDEX "idx_dificultades_curso_fecha" ON "dificultades_curso"("fecha_registro");

-- CreateIndex
CREATE INDEX "idx_misiones_completada_inscripcion" ON "misiones_completadas"("id_mision", "id_inscripcion");

-- CreateIndex
CREATE INDEX "idx_progreso_alumno_fecha" ON "progreso_alumno"("fecha_registro");

-- CreateIndex
CREATE INDEX "idx_progreso_curso_id_curso" ON "progreso_curso"("id_curso");

-- CreateIndex
CREATE INDEX "idx_progreso_curso_fecha" ON "progreso_curso"("fecha_registro");

-- AddForeignKey
ALTER TABLE "inscripciones_alumno_curso" ADD CONSTRAINT "inscripciones_alumno_curso_id_alumno_fkey" FOREIGN KEY ("id_alumno") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inscripciones_alumno_curso" ADD CONSTRAINT "inscripciones_alumno_curso_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dificultades_alumno" ADD CONSTRAINT "dificultades_alumno_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "inscripciones_alumno_curso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dificultades_alumno" ADD CONSTRAINT "dificultades_alumno_id_dificultad_fkey" FOREIGN KEY ("id_dificultad") REFERENCES "dificultades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dificultades_curso" ADD CONSTRAINT "dificultades_curso_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_docente_curso" ADD CONSTRAINT "asignaciones_docente_curso_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "asignaciones_docente_curso" ADD CONSTRAINT "asignaciones_docente_curso_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "misiones_especial_completada" ADD CONSTRAINT "misiones_especial_completada_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "inscripciones_alumno_curso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "misiones_completadas" ADD CONSTRAINT "misiones_completadas_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "inscripciones_alumno_curso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "progreso_alumno" ADD CONSTRAINT "progreso_alumno_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "inscripciones_alumno_curso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "progreso_curso" ADD CONSTRAINT "progreso_curso_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
