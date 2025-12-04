/*
  Warnings:

  - The values [Secuencia,Logica,Estructuras] on the enum `temas` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[nombre]` on the table `clases_consulta` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[descripcion]` on the table `clases_consulta` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[titulo]` on the table `consultas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[descripcion]` on the table `consultas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre]` on the table `cursos` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[descripcion]` on the table `cursos` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre]` on the table `dificultades` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[descripcion]` on the table `dificultades` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre]` on the table `misiones` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[descripcion]` on the table `misiones` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[enunciado]` on the table `preguntas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[descripcion]` on the table `valoraciones` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `descripcion` to the `mision_especial_completada` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `mision_especial_completada` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "temas_new" AS ENUM ('Secuencia y Lógica Básica', 'Lógica Proposicional', 'Estructuras de Control', 'Variables', 'Procedimientos', 'Ninguno');
ALTER TABLE "public"."dificultades_curso" ALTER COLUMN "tema_moda" DROP DEFAULT;
ALTER TABLE "consultas" ALTER COLUMN "tema" TYPE "temas_new" USING ("tema"::text::"temas_new");
ALTER TABLE "dificultades" ALTER COLUMN "tema" TYPE "temas_new" USING ("tema"::text::"temas_new");
ALTER TABLE "dificultades_curso" ALTER COLUMN "tema_moda" TYPE "temas_new" USING ("tema_moda"::text::"temas_new");
ALTER TYPE "temas" RENAME TO "temas_old";
ALTER TYPE "temas_new" RENAME TO "temas";
DROP TYPE "public"."temas_old";
ALTER TABLE "dificultades_curso" ALTER COLUMN "tema_moda" SET DEFAULT 'Ninguno';
COMMIT;

-- AlterTable
ALTER TABLE "mision_especial_completada" ADD COLUMN     "descripcion" VARCHAR(255) NOT NULL,
ADD COLUMN     "nombre" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "clases_consulta_nombre_key" ON "clases_consulta"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "clases_consulta_descripcion_key" ON "clases_consulta"("descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "consultas_titulo_key" ON "consultas"("titulo");

-- CreateIndex
CREATE UNIQUE INDEX "consultas_descripcion_key" ON "consultas"("descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "cursos_nombre_key" ON "cursos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cursos_descripcion_key" ON "cursos"("descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "dificultades_nombre_key" ON "dificultades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "dificultades_descripcion_key" ON "dificultades"("descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "misiones_nombre_key" ON "misiones"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "misiones_descripcion_key" ON "misiones"("descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "preguntas_enunciado_key" ON "preguntas"("enunciado");

-- CreateIndex
CREATE UNIQUE INDEX "valoraciones_descripcion_key" ON "valoraciones"("descripcion");
