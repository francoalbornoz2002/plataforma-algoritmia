-- AlterTable
ALTER TABLE "respuestas_alumno" ADD COLUMN     "es_correcta" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sesiones_refuerzo" ADD COLUMN     "fecha_inicio_real" TIMESTAMPTZ(6);
