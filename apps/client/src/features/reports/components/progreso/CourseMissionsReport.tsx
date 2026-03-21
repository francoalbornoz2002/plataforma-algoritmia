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
  IconButton,
  Tooltip,
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
import ReportStatCard from "../common/ReportStatCard";
import ReportTextualCard from "../common/ReportTextualCard";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { datePickerConfig } from "../../../../config/theme.config";
import HeaderReportPage from "../../../../components/HeaderReportPage";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";

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

  const handleClearFilters = () => {
    setFilters({
      dificultad: "",
      fechaDesde: "",
      fechaHasta: "",
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
    <Box
      component="section"
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        <HeaderReportPage
          title="Misiones Completadas"
          description="Resumen del estado de completado y desempeño de todas las misiones del curso."
          icon={<ListAltIcon />}
          filters={filters}
          endpointPathPdf={`/reportes/cursos/${courseId}/progreso/misiones/pdf`}
          endpointPathExcel={`/reportes/cursos/${courseId}/progreso/misiones/excel`}
          filenameExcel="misiones_completadas.xlsx"
          disabled={!data}
          sx={{ mb: 2 }}
        />

        {/* Filtros */}
        <QuickDateFilter onApply={handleQuickFilter} />
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <DatePicker
            label="Fecha Desde"
            value={
              filters.fechaDesde
                ? new Date(filters.fechaDesde + "T00:00:00")
                : null
            }
            maxDate={
              filters.fechaHasta
                ? new Date(filters.fechaHasta + "T00:00:00")
                : undefined
            }
            minDate={
              filters.fechaDesde
                ? new Date(filters.fechaDesde + "T00:00:00")
                : undefined
            }
            onChange={(val) =>
              setFilters({
                ...filters,
                fechaDesde: val ? format(val, "yyyy-MM-dd") : "",
              })
            }
            {...datePickerConfig}
            disableFuture
          />
          <DatePicker
            label="Fecha Hasta"
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
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
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
          <Tooltip title="Limpiar filtros">
            <IconButton
              onClick={handleClearFilters}
              size="small"
              color="primary"
            >
              <FilterAltOffIcon />
            </IconButton>
          </Tooltip>
        </Stack>

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

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: 3,
              width: "100%",
            }}
          >
            {/* Gráfico (Arriba) */}
            <Paper
              elevation={3}
              sx={{ p: 2, width: "100%", boxSizing: "border-box" }}
            >
              <Typography variant="h6">
                Misiones completadas en el tiempo
              </Typography>
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
                  height={350}
                />
              ) : (
                <Typography
                  color="text.secondary"
                  align="center"
                  sx={{ py: 4 }}
                >
                  No hay datos para mostrar en el gráfico
                </Typography>
              )}
            </Paper>

            {/* Tabla (Abajo) */}
            <Paper
              elevation={3}
              sx={{ height: 450, width: "100%", boxSizing: "border-box" }}
            >
              <DataGrid
                rows={data?.tabla || []}
                columns={columns}
                loading={loading}
                density="compact"
                sx={{ borderRadius: "0.7em", height: "100%", border: 0 }}
                disableRowSelectionOnClick
                slots={{
                  noRowsOverlay: () => (
                    <Stack
                      height="100%"
                      alignItems="center"
                      justifyContent="center"
                    >
                      No se encontraron misiones con los filtros aplicados.
                    </Stack>
                  ),
                }}
              />
            </Paper>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
