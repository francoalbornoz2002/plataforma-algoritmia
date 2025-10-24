/*
  Warnings:

  - Added the required column `dni` to the `usuarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fechaNacimiento` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "dni" TEXT NOT NULL,
ADD COLUMN     "fechaNacimiento" TIMESTAMP(3) NOT NULL;
