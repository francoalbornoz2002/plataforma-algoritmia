import { Box, Chip, Typography } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import { format, subDays, subMonths, subYears } from "date-fns";

interface QuickDateFilterProps {
  onApply: (startDate: string, endDate: string) => void;
}

export default function QuickDateFilter({ onApply }: QuickDateFilterProps) {
  const handleApply = (
    type: "today" | "3days" | "5days" | "week" | "month" | "year",
  ) => {
    const end = new Date();
    let start = new Date();

    switch (type) {
      case "today":
        // start es hoy
        break;
      case "3days":
        start = subDays(end, 3);
        break;
      case "5days":
        start = subDays(end, 5);
        break;
      case "week":
        start = subDays(end, 7);
        break;
      case "month":
        start = subMonths(end, 1);
        break;
      case "year":
        start = subYears(end, 1);
        break;
    }

    onApply(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
  };

  return (
    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
      <FilterListIcon color="action" />
      <Typography variant="subtitle2">Filtros Rápidos:</Typography>
      <Chip label="Hoy" onClick={() => handleApply("today")} clickable />
      <Chip
        label="Últimos 3 días"
        onClick={() => handleApply("3days")}
        clickable
      />
      <Chip
        label="Últimos 5 días"
        onClick={() => handleApply("5days")}
        clickable
      />
      <Chip
        label="Última semana"
        onClick={() => handleApply("week")}
        clickable
      />
      <Chip label="Último mes" onClick={() => handleApply("month")} clickable />
      <Chip label="Último año" onClick={() => handleApply("year")} clickable />
    </Box>
  );
}
