import {
  Paper,
  Stack,
  Typography,
  Box,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { ReactNode } from "react";
import PdfExportButton from "../features/reports/components/common/PdfExportButton";
import ExcelExportButton from "../features/reports/components/common/ExcelExportButton";
import CsvExportButton from "../features/reports/components/common/CsvExportButton";

interface HeaderReportPageProps {
  title: string;
  description: string;
  icon: ReactNode;
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
  sx?: SxProps<Theme>;
  // Props para la exportación
  filters: any;
  endpointPathPdf?: string;
  endpointPathExcel?: string;
  endpointPathCsv?: string;
  disabled?: boolean;
  filenameExcel?: string;
  filenameCsv?: string;
}

export default function HeaderReportPage({
  title,
  description,
  icon,
  color = "primary",
  sx,
  filters,
  endpointPathPdf,
  endpointPathExcel,
  endpointPathCsv,
  disabled = false,
  filenameExcel,
  filenameCsv,
}: HeaderReportPageProps) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2.5,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        borderLeft: "5px solid",
        borderColor: `${color}.main`,
        gap: 2,
        ...sx,
      }}
    >
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Box
            sx={{
              color: `${color}.main`,
              display: "flex",
              alignItems: "center",
            }}
          >
            {icon}
          </Box>
          <Typography variant="h5" color={`${color}.main`} fontWeight="bold">
            {title}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>

      <Stack direction="row" spacing={2}>
        {endpointPathPdf && (
          <PdfExportButton
            filters={filters}
            endpointPath={endpointPathPdf}
            disabled={disabled}
            sx={{ bgcolor: "background.paper" }}
          />
        )}
        {endpointPathExcel && (
          <ExcelExportButton
            filters={filters}
            endpointPath={endpointPathExcel}
            disabled={disabled}
            filename={filenameExcel}
            sx={{ bgcolor: "background.paper" }}
          />
        )}
        {endpointPathCsv && (
          <CsvExportButton
            filters={filters}
            endpointPath={endpointPathCsv}
            disabled={disabled}
            filename={filenameCsv}
            sx={{ bgcolor: "background.paper" }}
          />
        )}
      </Stack>
    </Paper>
  );
}
