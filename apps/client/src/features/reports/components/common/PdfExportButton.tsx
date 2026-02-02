import { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ReportExportDialog from "./ReportExportDialog";
import { handlePdfExport } from "../../utils/pdf-utils";

interface PdfExportButtonProps {
  filters: any;
  exportFunction: (params: any) => Promise<Blob>;
  fileName: string;
  disabled?: boolean;
  onError: (message: string) => void;
  label?: string;
}

export default function PdfExportButton({
  filters,
  exportFunction,
  fileName,
  disabled = false,
  onError,
  label = "Exportar PDF",
}: PdfExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExport = (aPresentarA: string) => {
    handlePdfExport(
      filters,
      aPresentarA,
      exportFunction,
      fileName,
      setLoading,
      () => setOpen(false),
      onError,
    );
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={
          loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <PictureAsPdfIcon />
          )
        }
        disabled={disabled || loading}
        color="error"
        onClick={() => setOpen(true)}
      >
        {loading ? "Generando..." : label}
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
