-- AlterTable
ALTER TABLE "alumno_curso" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "docente_curso" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "historial_dificultades" (
    "id" UUID NOT NULL,
    "id_alumno" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "id_dificultad" UUID NOT NULL,
    "grado" "grado_dificultad" NOT NULL,
    "fecha_cambio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_dificultades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_historial_dif_curso_fecha" ON "historial_dificultades"("id_curso", "fecha_cambio");

-- AddForeignKey
ALTER TABLE "historial_dificultades" ADD CONSTRAINT "historial_dificultades_id_alumno_fkey" FOREIGN KEY ("id_alumno") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historial_dificultades" ADD CONSTRAINT "historial_dificultades_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historial_dificultades" ADD CONSTRAINT "historial_dificultades_id_dificultad_fkey" FOREIGN KEY ("id_dificultad") REFERENCES "dificultades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
