import { Stack, Paper } from "@mui/material";
import SummaryReportSection from "./SummaryReportSection";
import HistoryReportSection from "./HistoryReportSection";
import ListReportSection from "./ListReportSection";

// --- COMPONENTE PRINCIPAL ---
export default function UsersReportTab() {
  return (
    <Stack spacing={4} sx={{ ml: 2, mr: 2 }}>
      {/* SECCIÓN 1: RESUMEN */}
      <Paper elevation={3} component="section" sx={{ p: 2 }}>
        <SummaryReportSection />
      </Paper>

      {/* SECCIÓN 2: HISTORIAL */}
      <Paper elevation={3} component="section" sx={{ p: 2 }}>
        <HistoryReportSection />
      </Paper>

      {/* SECCIÓN 3: LISTADO */}
      <Paper elevation={3} component="section" sx={{ p: 2 }}>
        <ListReportSection />
      </Paper>
    </Stack>
  );
}
