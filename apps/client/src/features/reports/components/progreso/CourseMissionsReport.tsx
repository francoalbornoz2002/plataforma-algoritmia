import { useState, useEffect } from "react";
import {
  Box,
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
import { format, parse } from "date-fns";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { LineChart } from "@mui/x-charts/LineChart";
import {
  getCourseMissionsReport,
  type CourseMissionsReportFilters,
} from "../../service/reports.service";
import { dificultad_mision } from "../../../../types";
import { useOptionalCourseContext } from "../../../../context/CourseContext";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import PdfExportButton from "../common/PdfExportButton";
import ExcelExportButton from "../common/ExcelExportButton";
import ReportStatCard from "../common/ReportStatCard";
import ReportTextualCard from "../common/ReportTextualCard";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { datePickerConfig } from "../../../../config/theme.config";

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
  const courseContext = useOptionalCourseContext();

  const courseCreatedAt =
    courseContext?.selectedCourse?.id === courseId
      ? courseContext?.selectedCourse?.createdAt
      : undefined;

  const maxMisiones =
    data?.grafico && data.grafico.length > 0
      ? Math.max(...data.grafico.map((d: any) => d.cantidad), 0)
      : 0;

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

  const handleQuickFilter = (start: string, end: string) => {
    setFilters({
      ...filters,
      fechaDesde: start,
      fechaHasta: end,
    });
  };

  const columns: GridColDef[] = [
    {
      field: "numero",
      headerName: "#",
      width: 50,
      align: "center",
      headerAlign: "center",
    },
    { field: "nombre", headerName: "Misión", flex: 1 },
    { field: "dificultad", headerName: "Dificultad", width: 120 },
    {
      field: "pctCompletado",
      headerName: "% Alumnos que completaron",
      width: 200,
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
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="h5"
          gutterBottom
          sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
        >
          Misiones Completadas
        </Typography>
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}
        >
          <PdfExportButton
            filters={filters}
            endpointPath={`/reportes/cursos/${courseId}/progreso/misiones/pdf`}
            disabled={!data}
          />
          <ExcelExportButton
            filters={filters}
            endpointPath={`/reportes/cursos/${courseId}/progreso/misiones/excel`}
            disabled={!data}
            filename="misiones_completadas.xlsx"
          />
        </Box>
      </Stack>

      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <QuickDateFilter onApply={handleQuickFilter} />
        <Box sx={{ mt: 2 }} />
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
            {...datePickerConfig}
            disableFuture
            minDate={courseCreatedAt ? new Date(courseCreatedAt) : undefined}
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
            {...datePickerConfig}
            disableFuture
            minDate={courseCreatedAt ? new Date(courseCreatedAt) : undefined}
          />
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* KPIs */}
        {data && (
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <ReportStatCard
                icon={<TaskAltIcon />}
                title="Misiones Completadas"
                subtitle="Total en el período"
                count={data.kpis.totalCompletions}
                color="info"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <ReportTextualCard
                icon={<EmojiEventsIcon />}
                title="Misión Destacada"
                value={data.kpis.topMission.nombre}
                description={`Mayor % completado (${data.kpis.topMission.porcentaje.toFixed(1)}%)`}
                color="warning"
              />
            </Box>
          </Stack>
        )}

        {/* Gráfico */}
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6">Misiones completadas</Typography>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Cantidad de misiones completadas en el periodo seleccionado.
          </Typography>
          {data?.grafico && data.grafico.length > 0 ? (
            <LineChart
              dataset={data.grafico}
              yAxis={[
                {
                  label: "Cantidad de misiones",
                  valueFormatter: (value: number) =>
                    Number.isInteger(value) ? value.toString() : "",
                  min: 0,
                  max: maxMisiones < 5 ? 5 : undefined,
                },
              ]}
              xAxis={[
                {
                  scaleType: "point",
                  dataKey: "fecha",
                  label: "Fecha",
                  valueFormatter: (date: string) =>
                    format(parse(date, "yyyy-MM-dd", new Date()), "dd/MM"),
                },
              ]}
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
