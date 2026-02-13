import { useState } from "react";
import { Button, type SxProps } from "@mui/material";
import TableViewIcon from "@mui/icons-material/TableView";
import ReportExportDialog from "./ReportExportDialog";
import apiClient from "../../../../lib/axios";

interface ExcelExportButtonProps {
  filters: any;
  endpointPath: string;
  disabled?: boolean;
  label?: string;
  filename?: string;
  sx?: SxProps;
}

export default function ExcelExportButton({
  filters,
  endpointPath,
  disabled = false,
  label = "Exportar Excel",
  filename = "reporte.xlsx",
  sx,
}: ExcelExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExport = async (aPresentarA: string) => {
    setLoading(true);
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined,
      ),
    );

    try {
      const response = await apiClient.get(endpointPath, {
        params: {
          ...cleanFilters,
          ...(aPresentarA ? { aPresentarA } : {}),
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      let finalFilename = filename;
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) finalFilename = match[1];
      }

      link.setAttribute("download", finalFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setOpen(false);
    } catch (error) {
      console.error("Error exportando Excel:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<TableViewIcon />}
        disabled={disabled || loading}
        color="success"
        onClick={() => setOpen(true)}
        sx={sx}
      >
        {label}
      </Button>

      <ReportExportDialog
        open={open}
        onClose={() => setOpen(false)}
        onExport={handleExport}
        isGenerating={loading}
        title="Exportar a Excel"
      />
    </>
  );
}
