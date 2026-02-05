import { useState } from "react";
import { Button } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ReportExportDialog from "./ReportExportDialog";
import apiClient from "../../../../lib/axios";

interface PdfExportButtonProps {
  filters: any;
  endpointPath: string;
  disabled?: boolean;
  onError?: (message: string) => void;
  label?: string;
}

export default function PdfExportButton({
  filters,
  endpointPath,
  disabled = false,
  label = "Exportar PDF",
  onError,
}: PdfExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExport = async (aPresentarA: string) => {
    setLoading(true);
    // Limpiar filtros vacíos
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined,
      ),
    );

    // Separamos courseId (si existe) del resto de los filtros que irán como query params.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { courseId, ...queryParams } = cleanFilters;

    try {
      // Usamos apiClient para incluir el Token de autorización
      const response = await apiClient.get(endpointPath, {
        params: {
          ...queryParams, // Usamos solo los filtros que son para la query
          ...(aPresentarA ? { aPresentarA } : {}),
        },
        responseType: "blob", // Importante para manejar binarios
      });

      // Creamos una URL local para el Blob y la abrimos
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");

      setOpen(false);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      if (onError)
        onError("No se pudo generar el reporte. Verifique su sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<PictureAsPdfIcon />}
        disabled={disabled || loading}
        color="error"
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>

      <ReportExportDialog
        open={open}
        onClose={() => setOpen(false)}
        onExport={handleExport}
        isGenerating={loading}
      />
    </>
  );
}
