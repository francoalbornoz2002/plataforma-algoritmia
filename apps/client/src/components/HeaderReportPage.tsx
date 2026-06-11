import { Paper, Stack, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";
import PdfExportButton from "../features/reports/components/common/PdfExportButton";
import ExcelExportButton from "../features/reports/components/common/ExcelExportButton";
import CsvExportButton from "../features/reports/components/common/CsvExportButton";
import CardIcon from "./CardIcon";

interface HeaderReportPageProps {
  title: string;
  description: string;
  icon: ReactNode;
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
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
        p: 2,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <CardIcon icon={icon} color={color} size="large" />
        <Stack justifyContent="center">
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        </Stack>
      </Stack>

      <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
        <Stack direction="row" spacing={1}>
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
      </Box>
    </Paper>
  );
}
