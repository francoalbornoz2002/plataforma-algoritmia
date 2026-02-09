/*
  Warnings:

  - You are about to drop the column `fecha_clase` on the `clases_consulta` table. All the data in the column will be lost.
  - You are about to drop the column `hora_fin` on the `clases_consulta` table. All the data in the column will be lost.
  - You are about to drop the column `hora_inicio` on the `clases_consulta` table. All the data in the column will be lost.
  - Added the required column `fecha_fin` to the `clases_consulta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fecha_inicio` to the `clases_consulta` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "idx_clases_consulta_fecha";

-- AlterTable
ALTER TABLE "clases_consulta" DROP COLUMN "fecha_clase",
DROP COLUMN "hora_fin",
DROP COLUMN "hora_inicio",
ADD COLUMN     "fecha_fin" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "fecha_inicio" TIMESTAMPTZ(6) NOT NULL;

-- CreateIndex
CREATE INDEX "idx_clases_consulta_fecha_inicio" ON "clases_consulta"("fecha_inicio");
