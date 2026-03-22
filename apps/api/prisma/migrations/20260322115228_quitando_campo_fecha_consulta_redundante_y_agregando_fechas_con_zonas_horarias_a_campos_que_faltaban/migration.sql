/*
  Warnings:

  - You are about to drop the column `fecha_consulta` on the `consultas` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_consultas_fecha";

-- AlterTable
ALTER TABLE "consultas" DROP COLUMN "fecha_consulta",
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "motivos_clase_no_realizada" ALTER COLUMN "fecha_registro" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "respuestas_consulta" ALTER COLUMN "fecha_respuesta" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "fecha_respuesta" SET DATA TYPE TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "idx_consultas_created_at" ON "consultas"("created_at");
