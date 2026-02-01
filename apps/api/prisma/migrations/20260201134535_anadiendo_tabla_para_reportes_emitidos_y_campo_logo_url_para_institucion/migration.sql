-- AlterTable
ALTER TABLE "institucion" ADD COLUMN     "logo_url" TEXT;

-- CreateTable
CREATE TABLE "reportes_generados" (
    "id" UUID NOT NULL,
    "nro_reporte" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "modulo" VARCHAR(100) NOT NULL,
    "fecha_generacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filtros_aplicados" JSONB,
    "id_usuario_generador" UUID NOT NULL,
    "a_presentar_a" VARCHAR(255),

    CONSTRAINT "reportes_generados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reportes_generados_id_usuario_generador_idx" ON "reportes_generados"("id_usuario_generador");

-- AddForeignKey
ALTER TABLE "reportes_generados" ADD CONSTRAINT "reportes_generados_id_usuario_generador_fkey" FOREIGN KEY ("id_usuario_generador") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
