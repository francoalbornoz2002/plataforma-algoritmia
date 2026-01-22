import { Stack, Paper } from "@mui/material";
import SummaryReportSection from "./SummaryReportSection";
import HistoryReportSection from "./HistoryReportSection";

// --- COMPONENTE PRINCIPAL ---
export default function UsersReportTab() {
  return (
    <Stack spacing={4} sx={{ ml: 2, mr: 2 }}>
      {/* SECCIÓN 1: RESUMEN */}
      <SummaryReportSection />

      {/* SECCIÓN 2: HISTORIAL */}
      <HistoryReportSection />
    </Stack>
  );
}
