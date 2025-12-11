-- AlterTable
ALTER TABLE "sesiones_refuerzo" ADD COLUMN     "id_docente" UUID;

-- AddForeignKey
ALTER TABLE "sesiones_refuerzo" ADD CONSTRAINT "sesiones_refuerzo_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
