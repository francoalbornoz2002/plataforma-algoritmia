import { useState, useEffect } from "react";
import {
  Typography,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  getCourseMissionsReport,
  type CourseMissionsReportFilters,
} from "../service/reports.service";
import { dificultad_mision } from "../../../types";

interface Props {
  courseId: string;
}

export default function CourseMissionsReport({ courseId }: Props) {
  const [filters, setFilters] = useState<CourseMissionsReportFilters>({
    dificultad: "",
    fechaDesde: "",
    fechaHasta: "",
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await getCourseMissionsReport(courseId, filters);
      setData(result);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el reporte de misiones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const columns: GridColDef[] = [
    { field: "nombre", headerName: "Misión", flex: 1 },
    { field: "dificultad", headerName: "Dificultad", width: 120 },
    {
      field: "pctCompletado",
      headerName: "% Completado",
      width: 130,
      valueFormatter: (value: number) => `${value.toFixed(1)}%`,
    },
    {
      field: "promEstrellas",
      headerName: "Prom. Estrellas",
      width: 130,
      valueFormatter: (value: number) => value.toFixed(1),
    },
    {
      field: "promIntentos",
      headerName: "Prom. Intentos",
      width: 130,
      valueFormatter: (value: number) => value.toFixed(1),
    },
  ];

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
      >
        Misiones Completadas
      </Typography>

      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
        >
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Dificultad</InputLabel>
            <Select
              value={filters.dificultad}
              label="Dificultad"
              onChange={(e) =>
                setFilters({ ...filters, dificultad: e.target.value as any })
              }
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value={dificultad_mision.Facil}>Fácil</MenuItem>
              <MenuItem value={dificultad_mision.Medio}>Medio</MenuItem>
              <MenuItem value={dificultad_mision.Dificil}>Difícil</MenuItem>
            </Select>
          </FormControl>

          <DatePicker
            label="Desde"
            value={
              filters.fechaDesde
                ? new Date(filters.fechaDesde + "T00:00:00")
                : null
            }
            onChange={(val) =>
              setFilters({
                ...filters,
                fechaDesde: val ? format(val, "yyyy-MM-dd") : "",
              })
            }
            slotProps={{ textField: { size: "small" } }}
          />
          <DatePicker
            label="Hasta"
            value={
              filters.fechaHasta
                ? new Date(filters.fechaHasta + "T00:00:00")
                : null
            }
            onChange={(val) =>
              setFilters({
                ...filters,
                fechaHasta: val ? format(val, "yyyy-MM-dd") : "",
              })
            }
            slotProps={{ textField: { size: "small" } }}
          />
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Gráfico */}
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Evolución de Completado
          </Typography>
          {data?.grafico && data.grafico.length > 0 ? (
            <BarChart
              dataset={data.grafico}
              xAxis={[{ scaleType: "band", dataKey: "fecha" }]}
              series={[
                {
                  dataKey: "cantidad",
                  label: "Misiones Completadas",
                  color: "#1976d2",
                },
              ]}
              height={300}
            />
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No hay datos para mostrar en el gráfico
            </Typography>
          )}
        </Paper>

        {/* Tabla */}
        <Paper elevation={3} sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={data?.tabla || []}
            columns={columns}
            loading={loading}
            density="compact"
            disableRowSelectionOnClick
          />
        </Paper>
      </Stack>
    </Paper>
  );
}
