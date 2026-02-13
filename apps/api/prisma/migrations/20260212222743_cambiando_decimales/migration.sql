-- AlterTable
ALTER TABLE "dificultades_curso" ALTER COLUMN "prom_dificultades" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "historial_dificultades_curso" ALTER COLUMN "prom_dificultades" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "historial_progreso_alumno" ALTER COLUMN "prom_estrellas" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "prom_intentos" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "historial_progreso_curso" ALTER COLUMN "prom_estrellas" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "prom_intentos" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "progreso_alumno" ALTER COLUMN "prom_estrellas" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "prom_intentos" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "progreso_curso" ALTER COLUMN "prom_estrellas" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "prom_intentos" SET DATA TYPE DECIMAL(5,2);
