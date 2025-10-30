-- CreateEnum
CREATE TYPE "dias_semana" AS ENUM ('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado');

-- CreateEnum
CREATE TYPE "dificultad_mision" AS ENUM ('Facil', 'Medio', 'Dificil');

-- CreateEnum
CREATE TYPE "estado_clase_consulta" AS ENUM ('Programada', 'Realizada', 'No realizada', 'Cancelada');

-- CreateEnum
CREATE TYPE "estado_consulta" AS ENUM ('Pendiente', 'A revisar', 'Revisada', 'Resuelta');

-- CreateEnum
CREATE TYPE "estado_revision" AS ENUM ('Pendiente', 'Revisadas');

-- CreateEnum
CREATE TYPE "estado_sesion" AS ENUM ('Pendiente', 'Completada', 'Incompleta', 'No realizada');

-- CreateEnum
CREATE TYPE "estado_simple" AS ENUM ('Activo', 'Inactivo');

-- CreateEnum
CREATE TYPE "generos" AS ENUM ('Masculino', 'Femenino', 'Otro');

-- CreateEnum
CREATE TYPE "grado_dificultad" AS ENUM ('Ninguno', 'Bajo', 'Medio', 'Alto');

-- CreateEnum
CREATE TYPE "modalidad" AS ENUM ('Presencial', 'Virtual');

-- CreateEnum
CREATE TYPE "roles" AS ENUM ('Administrador', 'Docente', 'Alumno');

-- CreateEnum
CREATE TYPE "temas" AS ENUM ('Secuencia', 'Logica', 'Estructuras', 'Variables', 'Procedimientos', 'Ninguno');

-- CreateTable
CREATE TABLE "alumno_curso" (
    "id_alumno" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "id_progreso" UUID NOT NULL,
    "estado" "estado_simple" NOT NULL,

    CONSTRAINT "alumno_curso_pkey" PRIMARY KEY ("id_alumno","id_curso")
);

-- CreateTable
CREATE TABLE "clases_consulta" (
    "id" UUID NOT NULL,
    "id_docente" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "fecha_clase" DATE NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_fin" TIME(6) NOT NULL,
    "modalidad" "modalidad" NOT NULL,
    "estado_clase" "estado_clase_consulta" NOT NULL,
    "estado_revision" "estado_revision" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "clases_consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas" (
    "id" UUID NOT NULL,
    "id_alumno" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "tema" "temas" NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "fecha_consulta" DATE NOT NULL,
    "estado" "estado_consulta" NOT NULL,
    "valoracion_alumno" SMALLINT,
    "comentario_valoracion" VARCHAR(255),

    CONSTRAINT "consultas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas_clase" (
    "id_consulta" UUID NOT NULL,
    "id_clase_consulta" UUID NOT NULL,
    "revisada_en_clase" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "consultas_clase_pkey" PRIMARY KEY ("id_consulta","id_clase_consulta")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" UUID NOT NULL,
    "id_progreso" UUID NOT NULL,
    "id_dificultades_curso" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "imagen_url" TEXT,
    "contraseña_acceso" VARCHAR(255) NOT NULL,
    "modalidad_preferencial" "modalidad" NOT NULL DEFAULT 'Presencial',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dias_clase" (
    "id" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "dia" "dias_semana" NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_fin" TIME(6) NOT NULL,
    "modalidad" "modalidad" NOT NULL,

    CONSTRAINT "dias_clase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dificultad_alumno" (
    "id_alumno" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "id_dificultad" UUID NOT NULL,
    "grado" "grado_dificultad" NOT NULL DEFAULT 'Ninguno',

    CONSTRAINT "dificultad_alumno_pkey" PRIMARY KEY ("id_alumno","id_curso","id_dificultad")
);

-- CreateTable
CREATE TABLE "dificultades" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "tema" "temas" NOT NULL,

    CONSTRAINT "dificultades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dificultades_curso" (
    "id" UUID NOT NULL,
    "tema_moda" "temas" NOT NULL DEFAULT 'Ninguno',
    "dificultad_moda" UUID,
    "prom_dificultades" DECIMAL(3,1) NOT NULL DEFAULT 0.0,
    "prom_grado" "grado_dificultad" NOT NULL DEFAULT 'Ninguno',
    "estado" "estado_simple" NOT NULL DEFAULT 'Activo',

    CONSTRAINT "dificultades_curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docente_curso" (
    "id_docente" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "estado" "estado_simple" NOT NULL,

    CONSTRAINT "docente_curso_pkey" PRIMARY KEY ("id_docente","id_curso")
);

-- CreateTable
CREATE TABLE "institucion" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "direccion" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(255) NOT NULL,
    "id_localidad" INTEGER NOT NULL,

    CONSTRAINT "institucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "localidades" (
    "id" SERIAL NOT NULL,
    "id_provincia" INTEGER NOT NULL,
    "localidad" VARCHAR(255) NOT NULL,

    CONSTRAINT "localidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_auditoria" (
    "id" BIGSERIAL NOT NULL,
    "tabla_afectada" VARCHAR(255) NOT NULL,
    "id_fila_afectada" VARCHAR(255) NOT NULL,
    "operacion" VARCHAR(255) NOT NULL,
    "id_usuario_modifico" UUID,
    "fecha_hora" TIMESTAMPTZ(6) NOT NULL,
    "valores_anteriores" JSONB,
    "valores_nuevos" JSONB,

    CONSTRAINT "log_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mision_especial_completada" (
    "id" UUID NOT NULL,
    "id_progreso" UUID NOT NULL,
    "estrellas" SMALLINT NOT NULL,
    "exp" SMALLINT NOT NULL,
    "intentos" SMALLINT NOT NULL,
    "fecha_completado" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mision_especial_completada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "misiones" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "dificultad_mision" "dificultad_mision" NOT NULL,

    CONSTRAINT "misiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "misiones_completadas" (
    "id_mision" UUID NOT NULL,
    "id_progreso" UUID NOT NULL,
    "estrellas" SMALLINT NOT NULL,
    "exp" SMALLINT NOT NULL,
    "intentos" SMALLINT NOT NULL,
    "fecha_completado" TIMESTAMPTZ(6),

    CONSTRAINT "misiones_completadas_pkey" PRIMARY KEY ("id_mision","id_progreso")
);

-- CreateTable
CREATE TABLE "opciones_respuesta" (
    "id" UUID NOT NULL,
    "id_pregunta" UUID NOT NULL,
    "texto_opcion" VARCHAR(255) NOT NULL,
    "es_correcta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "opciones_respuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas" (
    "id" UUID NOT NULL,
    "id_dificultad" UUID NOT NULL,
    "grado_dificultad" "grado_dificultad" NOT NULL,
    "enunciado" VARCHAR(255) NOT NULL,
    "id_docente" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas_sesion" (
    "id_sesion" UUID NOT NULL,
    "id_pregunta" UUID NOT NULL,

    CONSTRAINT "preguntas_sesion_pkey" PRIMARY KEY ("id_sesion","id_pregunta")
);

-- CreateTable
CREATE TABLE "progreso_alumno" (
    "id" UUID NOT NULL,
    "cant_misiones_completadas" INTEGER NOT NULL DEFAULT 0,
    "total_estrellas" INTEGER NOT NULL DEFAULT 0,
    "total_exp" INTEGER NOT NULL DEFAULT 0,
    "total_intentos" INTEGER NOT NULL DEFAULT 0,
    "pct_misiones_completadas" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "prom_estrellas" DECIMAL(2,1) NOT NULL DEFAULT 0.0,
    "prom_intentos" DECIMAL(3,1) NOT NULL DEFAULT 0.0,
    "ultima_actividad" TIMESTAMPTZ(6),
    "estado" "estado_simple" NOT NULL DEFAULT 'Activo',

    CONSTRAINT "progreso_alumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progreso_curso" (
    "id" UUID NOT NULL,
    "misiones_completadas" INTEGER NOT NULL DEFAULT 0,
    "total_estrellas" INTEGER NOT NULL DEFAULT 0,
    "total_exp" INTEGER NOT NULL DEFAULT 0,
    "total_intentos" INTEGER NOT NULL DEFAULT 0,
    "pct_misiones_completadas" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "prom_estrellas" DECIMAL(2,1) NOT NULL DEFAULT 0.0,
    "prom_intentos" DECIMAL(3,1) NOT NULL DEFAULT 0.0,
    "estado" "estado_simple" NOT NULL DEFAULT 'Activo',

    CONSTRAINT "progreso_curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provincias" (
    "id" SERIAL NOT NULL,
    "provincia" VARCHAR(255) NOT NULL,

    CONSTRAINT "provincias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuestas_alumno" (
    "id_sesion" UUID NOT NULL,
    "id_pregunta" UUID NOT NULL,
    "id_opcion_elegida" UUID NOT NULL,

    CONSTRAINT "respuestas_alumno_pkey" PRIMARY KEY ("id_sesion","id_pregunta")
);

-- CreateTable
CREATE TABLE "respuestas_consulta" (
    "id" UUID NOT NULL,
    "id_docente" UUID NOT NULL,
    "id_consulta" UUID NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "fecha_respuesta" DATE NOT NULL,

    CONSTRAINT "respuestas_consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados_sesion" (
    "id_sesion" UUID NOT NULL,
    "cant_correctas" SMALLINT NOT NULL,
    "cant_incorrectas" SMALLINT NOT NULL,
    "pct_aciertos" DECIMAL(5,2) NOT NULL,
    "fecha_completado" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "resultados_sesion_pkey" PRIMARY KEY ("id_sesion")
);

-- CreateTable
CREATE TABLE "sesiones_refuerzo" (
    "id" UUID NOT NULL,
    "id_curso" UUID NOT NULL,
    "id_alumno" UUID NOT NULL,
    "fecha_hora_limite" TIMESTAMPTZ(6) NOT NULL,
    "tiempo_limite" SMALLINT NOT NULL,
    "estado" "estado_sesion" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "sesiones_refuerzo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "apellido" VARCHAR(255) NOT NULL,
    "dni" VARCHAR(9) NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "genero" "generos" NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "rol" "roles" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valoraciones" (
    "valor" SMALLINT NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,

    CONSTRAINT "valoraciones_pkey" PRIMARY KEY ("valor")
);

-- CreateIndex
CREATE UNIQUE INDEX "alumno_curso_id_progreso_key" ON "alumno_curso"("id_progreso");

-- CreateIndex
CREATE INDEX "idx_alumno_curso_estado" ON "alumno_curso"("estado");

-- CreateIndex
CREATE INDEX "idx_alumno_curso_pks" ON "alumno_curso"("id_alumno", "id_curso");

-- CreateIndex
CREATE INDEX "idx_alumno_curso_progreso" ON "alumno_curso"("id_progreso");

-- CreateIndex
CREATE INDEX "idx_clases_consulta_curso" ON "clases_consulta"("id_curso");

-- CreateIndex
CREATE INDEX "idx_clases_consulta_docente" ON "clases_consulta"("id_docente");

-- CreateIndex
CREATE INDEX "idx_clases_consulta_estadoc" ON "clases_consulta"("estado_clase");

-- CreateIndex
CREATE INDEX "idx_clases_consulta_estador" ON "clases_consulta"("estado_revision");

-- CreateIndex
CREATE INDEX "idx_clases_consulta_fecha" ON "clases_consulta"("fecha_clase");

-- CreateIndex
CREATE INDEX "idx_consultas_alumno" ON "consultas"("id_alumno");

-- CreateIndex
CREATE INDEX "idx_consultas_curso" ON "consultas"("id_curso");

-- CreateIndex
CREATE INDEX "idx_consultas_estado" ON "consultas"("estado");

-- CreateIndex
CREATE INDEX "idx_consultas_fecha" ON "consultas"("fecha_consulta");

-- CreateIndex
CREATE INDEX "idx_consultas_tema" ON "consultas"("tema");

-- CreateIndex
CREATE INDEX "idx_consultas_valoracion" ON "consultas"("valoracion_alumno");

-- CreateIndex
CREATE INDEX "idx_consultas_clase_consclase" ON "consultas_clase"("id_consulta", "id_clase_consulta");

-- CreateIndex
CREATE INDEX "idx_cursos_activo" ON "cursos"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_cursos_dificultad" ON "cursos"("id_dificultades_curso");

-- CreateIndex
CREATE INDEX "idx_cursos_nombre" ON "cursos"("nombre");

-- CreateIndex
CREATE INDEX "idx_cursos_progreso" ON "cursos"("id_progreso");

-- CreateIndex
CREATE INDEX "idx_dias_clase_curso" ON "dias_clase"("id_curso");

-- CreateIndex
CREATE INDEX "idx_dificultad_alumno_c_d" ON "dificultad_alumno"("id_curso", "id_dificultad");

-- CreateIndex
CREATE INDEX "idx_dificultad_alumno_c_d_g" ON "dificultad_alumno"("id_curso", "id_dificultad", "grado");

-- CreateIndex
CREATE INDEX "idx_dificultad_alumno_difgrado" ON "dificultad_alumno"("id_dificultad", "grado");

-- CreateIndex
CREATE INDEX "idx_dificultad_alumno_grado" ON "dificultad_alumno"("grado");

-- CreateIndex
CREATE INDEX "idx_dificultad_alumno_pks" ON "dificultad_alumno"("id_alumno", "id_curso", "id_dificultad");

-- CreateIndex
CREATE INDEX "idx_dificultades_tema" ON "dificultades"("tema");

-- CreateIndex
CREATE INDEX "idx_dificultades_curso_moda" ON "dificultades_curso"("dificultad_moda");

-- CreateIndex
CREATE INDEX "idx_docente_curso_estado" ON "docente_curso"("estado");

-- CreateIndex
CREATE INDEX "idx_docente_curso_pks" ON "docente_curso"("id_docente", "id_curso");

-- CreateIndex
CREATE INDEX "idx_institucion_localidad" ON "institucion"("id_localidad");

-- CreateIndex
CREATE INDEX "idx_localidad_provincia" ON "localidades"("id_provincia");

-- CreateIndex
CREATE INDEX "idx_log_auditoria_fecha" ON "log_auditoria"("fecha_hora");

-- CreateIndex
CREATE INDEX "idx_log_auditoria_registro_historial" ON "log_auditoria"("tabla_afectada", "id_fila_afectada", "fecha_hora");

-- CreateIndex
CREATE INDEX "idx_log_auditoria_tabla_op_fecha" ON "log_auditoria"("tabla_afectada", "operacion", "fecha_hora");

-- CreateIndex
CREATE INDEX "idx_mision_especial_fecha" ON "mision_especial_completada"("fecha_completado");

-- CreateIndex
CREATE INDEX "idx_misiones_especiales_progreso" ON "mision_especial_completada"("id_progreso");

-- CreateIndex
CREATE INDEX "idx_misiones_completadas_fecha" ON "misiones_completadas"("fecha_completado");

-- CreateIndex
CREATE INDEX "idx_misiones_completadas_pks" ON "misiones_completadas"("id_mision", "id_progreso");

-- CreateIndex
CREATE INDEX "idx_opciones_respuesta_pregunta" ON "opciones_respuesta"("id_pregunta");

-- CreateIndex
CREATE INDEX "idx_preguntas_dificultad" ON "preguntas"("id_dificultad");

-- CreateIndex
CREATE INDEX "idx_preguntas_docente" ON "preguntas"("id_docente");

-- CreateIndex
CREATE INDEX "idx_preguntas_estado" ON "preguntas"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_preguntas_grado" ON "preguntas"("grado_dificultad");

-- CreateIndex
CREATE INDEX "idx_progreso_alumno_actividad" ON "progreso_alumno"("ultima_actividad");

-- CreateIndex
CREATE INDEX "idx_progreso_alumno_estado" ON "progreso_alumno"("estado");

-- CreateIndex
CREATE INDEX "idx_progreso_alumno_estrellas" ON "progreso_alumno"("prom_estrellas");

-- CreateIndex
CREATE INDEX "idx_progreso_alumno_intentos" ON "progreso_alumno"("prom_intentos");

-- CreateIndex
CREATE INDEX "idx_progreso_alumno_pct" ON "progreso_alumno"("pct_misiones_completadas");

-- CreateIndex
CREATE INDEX "idx_progreso_curso_estado" ON "progreso_curso"("estado");

-- CreateIndex
CREATE INDEX "idx_respuestas_alumno_opcion" ON "respuestas_alumno"("id_opcion_elegida");

-- CreateIndex
CREATE INDEX "idx_respuestas_alumno_pks" ON "respuestas_alumno"("id_sesion", "id_pregunta");

-- CreateIndex
CREATE UNIQUE INDEX "respuestas_consulta_id_consulta_key" ON "respuestas_consulta"("id_consulta");

-- CreateIndex
CREATE INDEX "idx_respuesta_consulta_docente" ON "respuestas_consulta"("id_docente");

-- CreateIndex
CREATE INDEX "idx_respuesta_consulta_consulta" ON "respuestas_consulta"("id_consulta");

-- CreateIndex
CREATE INDEX "idx_respuesta_consulta_fecha" ON "respuestas_consulta"("fecha_respuesta");

-- CreateIndex
CREATE INDEX "idx_resultados_sesion_fecha" ON "resultados_sesion"("fecha_completado");

-- CreateIndex
CREATE INDEX "idx_resultados_sesion_pct_aciertos" ON "resultados_sesion"("pct_aciertos");

-- CreateIndex
CREATE INDEX "idx_sesion_alumno" ON "sesiones_refuerzo"("id_alumno");

-- CreateIndex
CREATE INDEX "idx_sesion_creado" ON "sesiones_refuerzo"("created_at");

-- CreateIndex
CREATE INDEX "idx_sesion_curso" ON "sesiones_refuerzo"("id_curso");

-- CreateIndex
CREATE INDEX "idx_sesion_estado" ON "sesiones_refuerzo"("estado");

-- CreateIndex
CREATE INDEX "idx_sesion_fecha_hora_limite" ON "sesiones_refuerzo"("fecha_hora_limite");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_dni_key" ON "usuarios"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "idx_usuario_activo" ON "usuarios"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_usuario_apellido" ON "usuarios"("apellido");

-- CreateIndex
CREATE INDEX "idx_usuario_nombre" ON "usuarios"("nombre");

-- CreateIndex
CREATE INDEX "idx_usuario_rol" ON "usuarios"("rol");

-- AddForeignKey
ALTER TABLE "alumno_curso" ADD CONSTRAINT "alumno_curso_id_alumno_fkey" FOREIGN KEY ("id_alumno") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alumno_curso" ADD CONSTRAINT "alumno_curso_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alumno_curso" ADD CONSTRAINT "alumno_curso_id_progreso_fkey" FOREIGN KEY ("id_progreso") REFERENCES "progreso_alumno"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clases_consulta" ADD CONSTRAINT "clases_consulta_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clases_consulta" ADD CONSTRAINT "clases_consulta_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_id_alumno_fkey" FOREIGN KEY ("id_alumno") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_valoracion_alumno_fkey" FOREIGN KEY ("valoracion_alumno") REFERENCES "valoraciones"("valor") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consultas_clase" ADD CONSTRAINT "consultas_clase_id_clase_consulta_fkey" FOREIGN KEY ("id_clase_consulta") REFERENCES "clases_consulta"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consultas_clase" ADD CONSTRAINT "consultas_clase_id_consulta_fkey" FOREIGN KEY ("id_consulta") REFERENCES "consultas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_id_dificultades_curso_fkey" FOREIGN KEY ("id_dificultades_curso") REFERENCES "dificultades_curso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_id_progreso_fkey" FOREIGN KEY ("id_progreso") REFERENCES "progreso_curso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dias_clase" ADD CONSTRAINT "dias_clase_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dificultad_alumno" ADD CONSTRAINT "dificultad_alumno_id_alumno_fkey" FOREIGN KEY ("id_alumno") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dificultad_alumno" ADD CONSTRAINT "dificultad_alumno_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dificultad_alumno" ADD CONSTRAINT "dificultad_alumno_id_dificultad_fkey" FOREIGN KEY ("id_dificultad") REFERENCES "dificultades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dificultades_curso" ADD CONSTRAINT "dificultades_curso_dificultad_moda_fkey" FOREIGN KEY ("dificultad_moda") REFERENCES "dificultades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docente_curso" ADD CONSTRAINT "docente_curso_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docente_curso" ADD CONSTRAINT "docente_curso_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "institucion" ADD CONSTRAINT "institucion_id_localidad_fkey" FOREIGN KEY ("id_localidad") REFERENCES "localidades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "localidades" ADD CONSTRAINT "localidades_id_provincia_fkey" FOREIGN KEY ("id_provincia") REFERENCES "provincias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "log_auditoria" ADD CONSTRAINT "log_auditoria_id_usuario_modifico_fkey" FOREIGN KEY ("id_usuario_modifico") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mision_especial_completada" ADD CONSTRAINT "mision_especial_completada_id_progreso_fkey" FOREIGN KEY ("id_progreso") REFERENCES "progreso_alumno"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "misiones_completadas" ADD CONSTRAINT "misiones_completadas_id_mision_fkey" FOREIGN KEY ("id_mision") REFERENCES "misiones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "misiones_completadas" ADD CONSTRAINT "misiones_completadas_id_progreso_fkey" FOREIGN KEY ("id_progreso") REFERENCES "progreso_alumno"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "opciones_respuesta" ADD CONSTRAINT "opciones_respuesta_id_pregunta_fkey" FOREIGN KEY ("id_pregunta") REFERENCES "preguntas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_id_dificultad_fkey" FOREIGN KEY ("id_dificultad") REFERENCES "dificultades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "preguntas_sesion" ADD CONSTRAINT "preguntas_sesion_id_pregunta_fkey" FOREIGN KEY ("id_pregunta") REFERENCES "preguntas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "preguntas_sesion" ADD CONSTRAINT "preguntas_sesion_id_sesion_fkey" FOREIGN KEY ("id_sesion") REFERENCES "sesiones_refuerzo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "respuestas_alumno" ADD CONSTRAINT "respuestas_alumno_id_opcion_elegida_fkey" FOREIGN KEY ("id_opcion_elegida") REFERENCES "opciones_respuesta"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "respuestas_alumno" ADD CONSTRAINT "respuestas_alumno_id_pregunta_fkey" FOREIGN KEY ("id_pregunta") REFERENCES "preguntas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "respuestas_alumno" ADD CONSTRAINT "respuestas_alumno_id_sesion_fkey" FOREIGN KEY ("id_sesion") REFERENCES "resultados_sesion"("id_sesion") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "respuestas_consulta" ADD CONSTRAINT "respuestas_consulta_id_consulta_fkey" FOREIGN KEY ("id_consulta") REFERENCES "consultas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "respuestas_consulta" ADD CONSTRAINT "respuestas_consulta_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resultados_sesion" ADD CONSTRAINT "resultados_sesion_id_sesion_fkey" FOREIGN KEY ("id_sesion") REFERENCES "sesiones_refuerzo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sesiones_refuerzo" ADD CONSTRAINT "sesiones_refuerzo_id_alumno_fkey" FOREIGN KEY ("id_alumno") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sesiones_refuerzo" ADD CONSTRAINT "sesiones_refuerzo_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

