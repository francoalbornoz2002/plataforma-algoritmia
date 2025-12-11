/*
  Warnings:

  - Added the required column `id_dificultad` to the `sesiones_refuerzo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sesiones_refuerzo" ADD COLUMN     "grado_sesion" "grado_dificultad" NOT NULL DEFAULT 'Ninguno',
ADD COLUMN     "id_dificultad" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "sesiones_refuerzo" ADD CONSTRAINT "sesiones_refuerzo_id_dificultad_fkey" FOREIGN KEY ("id_dificultad") REFERENCES "dificultades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
