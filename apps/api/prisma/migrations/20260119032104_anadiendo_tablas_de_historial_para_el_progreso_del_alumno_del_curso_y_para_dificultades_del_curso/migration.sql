/*
  Warnings:

  - You are about to drop the `historial_dificultades` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "historial_dificultades" DROP CONSTRAINT "historial_dificultades_id_alumno_fkey";

-- DropForeignKey
ALTER TABLE "historial_dificultades" DROP CONSTRAINT "historial_dificultades_id_curso_fkey";

-- DropForeignKey
ALTER TABLE "historial_dificultades" DROP CONSTRAINT "historial_dificultades_id_dificultad_fkey";

-- DropTable
DROP TABLE "historial_dificultades";

-- CreateTable
CREATE TABLE "historial_dificultades_alumno" (
    "id" UUID NOT NULL,
    "id_alumno" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "id_dificultad" UUID NOT NULL,
    "grado" "grado_dificultad" NOT NULL,
    "fecha_cambio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_dificultades_alumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_dificultades_curso" (
    "id" UUID NOT NULL,
    "id_dificultades_curso" UUID NOT NULL,
    "tema_moda" "temas" NOT NULL,
    "dificultad_moda" UUID,
    "prom_dificultades" DECIMAL(3,1) NOT NULL,
    "prom_grado" "grado_dificultad" NOT NULL,
    "fecha_registro" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_dificultades_curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_progreso_alumno" (
    "id" UUID NOT NULL,
    "id_progreso" UUID NOT NULL,
    "cant_misiones_completadas" INTEGER NOT NULL,
    "total_estrellas" INTEGER NOT NULL,
    "total_exp" INTEGER NOT NULL,
    "total_intentos" INTEGER NOT NULL,
    "pct_misiones_completadas" DECIMAL(5,2) NOT NULL,
    "prom_estrellas" DECIMAL(2,1) NOT NULL,
    "prom_intentos" DECIMAL(3,1) NOT NULL,
    "fecha_registro" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_progreso_alumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_progreso_curso" (
    "id" UUID NOT NULL,
    "id_progreso_curso" UUID NOT NULL,
    "misiones_completadas" INTEGER NOT NULL,
    "total_estrellas" INTEGER NOT NULL,
    "total_exp" INTEGER NOT NULL,
    "total_intentos" INTEGER NOT NULL,
    "pct_misiones_completadas" DECIMAL(5,2) NOT NULL,
    "prom_estrellas" DECIMAL(2,1) NOT NULL,
    "prom_intentos" DECIMAL(3,1) NOT NULL,
    "fecha_registro" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_progreso_curso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_historial_dif_alumno_fecha" ON "historial_dificultades_alumno"("id_curso", "fecha_cambio");

-- CreateIndex
CREATE INDEX "idx_historial_dif_curso_fecha" ON "historial_dificultades_curso"("id_dificultades_curso", "fecha_registro");

-- CreateIndex
CREATE INDEX "idx_historial_prog_alumno_fecha" ON "historial_progreso_alumno"("id_progreso", "fecha_registro");

-- CreateIndex
CREATE INDEX "idx_historial_prog_curso_fecha" ON "historial_progreso_curso"("id_progreso_curso", "fecha_registro");

-- AddForeignKey
ALTER TABLE "historial_dificultades_alumno" ADD CONSTRAINT "historial_dificultades_alumno_id_alumno_fkey" FOREIGN KEY ("id_alumno") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historial_dificultades_alumno" ADD CONSTRAINT "historial_dificultades_alumno_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historial_dificultades_alumno" ADD CONSTRAINT "historial_dificultades_alumno_id_dificultad_fkey" FOREIGN KEY ("id_dificultad") REFERENCES "dificultades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historial_dificultades_curso" ADD CONSTRAINT "historial_dificultades_curso_id_dificultades_curso_fkey" FOREIGN KEY ("id_dificultades_curso") REFERENCES "dificultades_curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_progreso_alumno" ADD CONSTRAINT "historial_progreso_alumno_id_progreso_fkey" FOREIGN KEY ("id_progreso") REFERENCES "progreso_alumno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_progreso_curso" ADD CONSTRAINT "historial_progreso_curso_id_progreso_curso_fkey" FOREIGN KEY ("id_progreso_curso") REFERENCES "progreso_curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;
