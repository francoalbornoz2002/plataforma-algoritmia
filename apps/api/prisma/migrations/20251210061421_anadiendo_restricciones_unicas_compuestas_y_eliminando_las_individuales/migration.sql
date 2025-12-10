/*
  Warnings:

  - A unique constraint covering the columns `[id_curso,nombre]` on the table `clases_consulta` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_curso,descripcion]` on the table `clases_consulta` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_curso,titulo]` on the table `consultas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_curso,descripcion]` on the table `consultas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_curso,nro_sesion]` on the table `sesiones_refuerzo` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nro_sesion` to the `sesiones_refuerzo` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "clases_consulta_descripcion_key";

-- DropIndex
DROP INDEX "clases_consulta_nombre_key";

-- DropIndex
DROP INDEX "consultas_descripcion_key";

-- DropIndex
DROP INDEX "consultas_titulo_key";

-- AlterTable
ALTER TABLE "sesiones_refuerzo" ADD COLUMN     "nro_sesion" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "uq_clase_consulta_curso_nombre" ON "clases_consulta"("id_curso", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uq_clase_consulta_curso_descripcion" ON "clases_consulta"("id_curso", "descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "uq_consulta_curso_titulo" ON "consultas"("id_curso", "titulo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_consulta_curso_descripcion" ON "consultas"("id_curso", "descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "uq_sesion_curso_numero" ON "sesiones_refuerzo"("id_curso", "nro_sesion");
