/*
  Warnings:

  - You are about to drop the `courses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `students_courses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teachers_courses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'DOCENTE', 'ALUMNO');

-- CreateEnum
CREATE TYPE "Modalidad" AS ENUM ('PRESENCIAL', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "DiaDeSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO');

-- DropForeignKey
ALTER TABLE "public"."students_courses" DROP CONSTRAINT "students_courses_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."students_courses" DROP CONSTRAINT "students_courses_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."students_courses" DROP CONSTRAINT "students_courses_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."teachers_courses" DROP CONSTRAINT "teachers_courses_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."teachers_courses" DROP CONSTRAINT "teachers_courses_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "public"."teachers_courses" DROP CONSTRAINT "teachers_courses_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_courseId_fkey";

-- DropTable
DROP TABLE "public"."courses";

-- DropTable
DROP TABLE "public"."students_courses";

-- DropTable
DROP TABLE "public"."teachers_courses";

-- DropTable
DROP TABLE "public"."users";

-- DropEnum
DROP TYPE "public"."Role";

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "claveAcceso" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios_clase" (
    "id" TEXT NOT NULL,
    "dia" "DiaDeSemana" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "modalidad" "Modalidad" NOT NULL,
    "cursoId" TEXT NOT NULL,

    CONSTRAINT "horarios_clase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docentes_cursos" (
    "cursoId" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,

    CONSTRAINT "docentes_cursos_pkey" PRIMARY KEY ("cursoId","docenteId")
);

-- CreateTable
CREATE TABLE "alumnos_cursos" (
    "cursoId" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,

    CONSTRAINT "alumnos_cursos_pkey" PRIMARY KEY ("cursoId","alumnoId")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "horarios_clase_cursoId_idx" ON "horarios_clase"("cursoId");

-- CreateIndex
CREATE INDEX "docentes_cursos_docenteId_idx" ON "docentes_cursos"("docenteId");

-- CreateIndex
CREATE INDEX "alumnos_cursos_alumnoId_idx" ON "alumnos_cursos"("alumnoId");

-- AddForeignKey
ALTER TABLE "horarios_clase" ADD CONSTRAINT "horarios_clase_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docentes_cursos" ADD CONSTRAINT "docentes_cursos_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docentes_cursos" ADD CONSTRAINT "docentes_cursos_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumnos_cursos" ADD CONSTRAINT "alumnos_cursos_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumnos_cursos" ADD CONSTRAINT "alumnos_cursos_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
