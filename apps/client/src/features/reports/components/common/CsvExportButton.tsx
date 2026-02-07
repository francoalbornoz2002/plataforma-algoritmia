import { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import TableViewIcon from "@mui/icons-material/TableView";
import apiClient from "../../../../lib/axios";
import { useSnackbar } from "notistack";

interface CsvExportButtonProps {
  filters: any;
  endpointPath: string;
  disabled?: boolean;
  label?: string;
  filename?: string;
}

export default function CsvExportButton({
  filters,
  endpointPath,
  disabled = false,
  label = "Exportar CSV",
  filename = "reporte.csv",
}: CsvExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleExport = async () => {
    setLoading(true);
    // Limpiar filtros vacíos/nulos
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined,
      ),
    );

    try {
      const response = await apiClient.get(endpointPath, {
        params: cleanFilters,
        responseType: "blob", // Importante para descarga de archivos
      });

      // Crear URL del blob y forzar descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Intentar obtener nombre del header o usar el default
      let finalFilename = filename;
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) finalFilename = match[1];
      }

      link.setAttribute("download", finalFilename);
      document.body.appendChild(link);
      link.click();

      // Limpieza
      link.remove();
      window.URL.revokeObjectURL(url);

      enqueueSnackbar("Exportación completada con éxito", {
        variant: "success",
      });
    } catch (error) {
      console.error("Error exportando CSV:", error);
      enqueueSnackbar("Error al exportar el archivo CSV", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outlined"
      startIcon={
        loading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          <TableViewIcon />
        )
      }
      disabled={disabled || loading}
      color="success"
      onClick={handleExport}
    >
      {label}
    </Button>
  );
}
