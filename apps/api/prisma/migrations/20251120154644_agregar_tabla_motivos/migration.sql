-- CreateTable
CREATE TABLE "motivos_clase_no_realizada" (
    "id" UUID NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_clase_consulta" UUID NOT NULL,

    CONSTRAINT "motivos_clase_no_realizada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "motivos_clase_no_realizada_id_clase_consulta_key" ON "motivos_clase_no_realizada"("id_clase_consulta");

-- AddForeignKey
ALTER TABLE "motivos_clase_no_realizada" ADD CONSTRAINT "motivos_clase_no_realizada_id_clase_consulta_fkey" FOREIGN KEY ("id_clase_consulta") REFERENCES "clases_consulta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
