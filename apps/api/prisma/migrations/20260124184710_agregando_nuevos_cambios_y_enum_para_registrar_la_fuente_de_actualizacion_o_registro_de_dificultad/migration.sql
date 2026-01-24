/*
  Warnings:

  - You are about to drop the column `grado` on the `historial_dificultades_alumno` table. All the data in the column will be lost.
  - Added the required column `grado_nuevo` to the `historial_dificultades_alumno` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "fuente_cambio_dificultad" AS ENUM ('Videojuego', 'Sesión de Refuerzo');

-- AlterTable
ALTER TABLE "historial_dificultades_alumno" DROP COLUMN "grado",
ADD COLUMN     "fuente" "fuente_cambio_dificultad" NOT NULL DEFAULT 'Videojuego',
ADD COLUMN     "grado_anterior" "grado_dificultad" NOT NULL DEFAULT 'Ninguno',
ADD COLUMN     "grado_nuevo" "grado_dificultad" NOT NULL;
