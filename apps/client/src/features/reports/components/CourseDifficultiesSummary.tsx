import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Button,
  Grid,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import WarningIcon from "@mui/icons-material/Warning";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
  getCourseDifficultiesReport,
  type CourseDifficultiesReportFilters,
  AgrupacionDificultad,
} from "../service/reports.service";
import { useOptionalCourseContext } from "../../../context/CourseContext";

interface Props {
  courseId: string;
}

export default function CourseDifficultiesSummary({ courseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CourseDifficultiesReportFilters>({
    fechaCorte: "",
    agruparPor: AgrupacionDificultad.TODO,
  });
  const courseContext = useOptionalCourseContext();

  const courseCreatedAt =
    courseContext?.selectedCourse?.id === courseId
      ? courseContext?.selectedCourse?.createdAt
      : undefined;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getCourseDifficultiesReport(courseId, filters);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el reporte de dificultades.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, filters]);

  const handleClearFilter = () => {
    setFilters({ ...filters, fechaCorte: "" });
  };

  const columns: GridColDef[] = [
    { field: "nombre", headerName: "Dificultad", flex: 1, minWidth: 150 },
    { field: "tema", headerName: "Tema", width: 120 },
    {
      field: "total",
      headerName: "Alumnos Afectados",
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "gradoAlto",
      headerName: "Grado Alto",
      width: 100,
      align: "center",
      headerAlign: "center",
      valueGetter: (params, row) => row.grados?.Alto || 0,
    },
    {
      field: "gradoMedio",
      headerName: "Grado Medio",
      width: 100,
      align: "center",
      headerAlign: "center",
      valueGetter: (params, row) => row.grados?.Medio || 0,
    },
    {
      field: "gradoBajo",
      headerName: "Grado Bajo",
      width: 100,
      align: "center",
      headerAlign: "center",
      valueGetter: (params, row) => row.grados?.Bajo || 0,
    },
  ];

  // Preparar datos para el gráfico de barras apiladas
  const barChartData =
    data?.tabla?.map((item: any) => ({
      nombre: item.nombre,
      bajo: item.grados.Bajo,
      medio: item.grados.Medio,
      alto: item.grados.Alto,
    })) || [];

  const showLoading = loading && !data;

  return (
    <Box component="section">
      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <DatePicker
            label="Fecha de Corte (Histórico)"
            value={
              filters.fechaCorte
                ? new Date(filters.fechaCorte + "T00:00:00")
                : null
            }
            onChange={(val) =>
              setFilters({
                ...filters,
                fechaCorte: val ? format(val, "yyyy-MM-dd") : "",
              })
            }
            slotProps={{ textField: { size: "small", sx: { width: 250 } } }}
            disableFuture
            minDate={courseCreatedAt ? new Date(courseCreatedAt) : undefined}
          />
          {filters.fechaCorte && (
            <Button variant="text" size="small" onClick={handleClearFilter}>
              Ver Actual
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Acciones */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          disabled={!data}
          color="error"
        >
          Exportar PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<TableOnIcon />}
          disabled={!data}
          color="success"
        >
          Exportar Excel
        </Button>
      </Box>

      {showLoading && (
        <CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {data && !showLoading && (
        <Stack spacing={3}>
          {/* KPIs */}
          <Grid container spacing={2}>
            <Grid sx={{ xs: 12, md: 3 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Promedio Dificultades/Alumno
                  </Typography>
                  <Typography
                    variant="h4"
                    color="primary.main"
                    fontWeight="bold"
                  >
                    {data.kpis.promDificultades.toFixed(1)}
                  </Typography>
                  <Typography variant="caption">
                    Total Alumnos: {data.kpis.totalAlumnos}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid sx={{ xs: 12, md: 3 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tema Más Frecuente
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {data.kpis.temaFrecuente.nombre}
                  </Typography>
                  <Typography variant="caption" color="error">
                    Afecta al {data.kpis.temaFrecuente.pctAlumnos.toFixed(1)}%
                    de alumnos
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid sx={{ xs: 12, md: 3 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Dificultad Más Frecuente
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {data.kpis.dificultadFrecuente.nombre}
                  </Typography>
                  <Typography variant="caption" color="warning.main">
                    Afecta al{" "}
                    {data.kpis.dificultadFrecuente.pctAlumnos.toFixed(1)}% de
                    alumnos
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid sx={{ xs: 12, md: 3 }}>
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Alumnos con Grado Alto
                  </Typography>
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    {data.kpis.gradoAlto.pctAlumnos.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption">
                    Moda en Alto: {data.kpis.gradoAlto.modaNombre}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Gráficos de Distribución */}
          <Grid container spacing={3}>
            <Grid sx={{ xs: 12, md: 4 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Por Tema
                </Typography>
                <PieChart
                  series={[
                    {
                      data: data.graficos.porTema,
                      innerRadius: 30,
                      paddingAngle: 2,
                      cornerRadius: 4,
                    },
                  ]}
                  height={200}
                />
              </Paper>
            </Grid>
            <Grid sx={{ xs: 12, md: 4 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Por Dificultad
                </Typography>
                <PieChart
                  series={[
                    {
                      data: data.graficos.porDificultad,
                      innerRadius: 30,
                      paddingAngle: 2,
                      cornerRadius: 4,
                    },
                  ]}
                  height={200}
                />
              </Paper>
            </Grid>
            <Grid sx={{ xs: 12, md: 4 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Por Grado
                </Typography>
                <PieChart
                  series={[
                    {
                      data: data.graficos.porGrado,
                      innerRadius: 30,
                      paddingAngle: 2,
                      cornerRadius: 4,
                    },
                  ]}
                  height={200}
                  slotProps={{
                    legend: {
                      direction: "horizontal",
                      position: { vertical: "bottom", horizontal: "center" },
                    },
                  }}
                />
              </Paper>
            </Grid>
          </Grid>

          {/* Gráfico Detallado (Barras Apiladas) */}
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Distribución de Grados por Dificultad
            </Typography>
            {barChartData.length > 0 ? (
              <BarChart
                dataset={barChartData}
                xAxis={[{ scaleType: "band", dataKey: "nombre" }]}
                series={[
                  {
                    dataKey: "bajo",
                    label: "Bajo",
                    stack: "total",
                    color: "#4caf50",
                  },
                  {
                    dataKey: "medio",
                    label: "Medio",
                    stack: "total",
                    color: "#ff9800",
                  },
                  {
                    dataKey: "alto",
                    label: "Alto",
                    stack: "total",
                    color: "#f44336",
                  },
                ]}
                height={350}
                margin={{ top: 20, bottom: 40, left: 40, right: 10 }}
              />
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No hay datos suficientes para mostrar el gráfico.
              </Typography>
            )}
          </Paper>

          {/* Tabla Detalle */}
          <Paper elevation={3} sx={{ height: 400, width: "100%" }}>
            <DataGrid
              rows={data.tabla}
              columns={columns}
              density="compact"
              disableRowSelectionOnClick
            />
          </Paper>
        </Stack>
      )}
    </Box>
  );
}
