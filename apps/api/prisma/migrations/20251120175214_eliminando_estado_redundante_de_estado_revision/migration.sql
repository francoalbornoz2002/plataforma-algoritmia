/*
  Warnings:

  - You are about to drop the column `estado_revision` on the `clases_consulta` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_clases_consulta_estador";

-- AlterTable
ALTER TABLE "clases_consulta" DROP COLUMN "estado_revision";

-- DropEnum
DROP TYPE "estado_revision";
