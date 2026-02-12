/*
  Warnings:

  - A unique constraint covering the columns `[numero]` on the table `misiones` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `numero` to the `misiones` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "misiones" ADD COLUMN     "numero" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "misiones_numero_key" ON "misiones"("numero");
