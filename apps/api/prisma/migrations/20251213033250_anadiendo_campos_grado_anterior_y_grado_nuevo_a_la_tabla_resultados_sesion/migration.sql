-- AlterTable
ALTER TABLE "resultados_sesion" ADD COLUMN     "grado_anterior" "grado_dificultad" NOT NULL DEFAULT 'Ninguno',
ADD COLUMN     "grado_nuevo" "grado_dificultad" NOT NULL DEFAULT 'Ninguno';
