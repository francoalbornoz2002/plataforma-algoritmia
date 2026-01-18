/*
  Warnings:

  - You are about to drop the column `created_at` on the `alumno_curso` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `alumno_curso` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `docente_curso` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `docente_curso` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "alumno_curso" DROP COLUMN "created_at",
DROP COLUMN "deleted_at",
ADD COLUMN     "fecha_baja" TIMESTAMPTZ(6),
ADD COLUMN     "fecha_inscripcion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "docente_curso" DROP COLUMN "created_at",
DROP COLUMN "deleted_at",
ADD COLUMN     "fecha_asignacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fecha_baja" TIMESTAMPTZ(6);
