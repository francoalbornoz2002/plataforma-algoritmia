import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Button,
  Grid,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
  getCourseDifficultiesReport,
  type CourseDifficultiesReportFilters,
} from "../../service/reports.service";
import { useOptionalCourseContext } from "../../../../context/CourseContext";

interface Props {
  courseId: string;
}

export default function CourseDifficultiesSummary({ courseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CourseDifficultiesReportFilters>({
    fechaCorte: "",
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
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
      >
        Resumen de Dificultades del Curso
      </Typography>

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
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "2.5fr 1.6fr" },
              gap: 3,
            }}
          >
            {/* Izquierda: Por Dificultad (Más grande) */}
            <Box sx={{ minWidth: 0 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: 450,
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
                  height={400}
                  slotProps={{
                    legend: {
                      direction: "vertical",
                      position: { vertical: "middle", horizontal: "end" },
                      sx: { ml: 10 },
                    },
                  }}
                />
              </Paper>
            </Box>

            {/* Derecha: Stack de Tema y Grado */}
            <Box sx={{ minWidth: 0 }}>
              <Stack spacing={3} sx={{ height: "100%" }}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
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
                    height={180}
                    slotProps={{
                      legend: {
                        direction: "horizontal",
                        position: { vertical: "bottom", horizontal: "center" },
                      },
                    }}
                    margin={{ bottom: 20 }}
                  />
                </Paper>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
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
                    height={180}
                    slotProps={{
                      legend: {
                        direction: "horizontal",
                        position: { vertical: "bottom", horizontal: "center" },
                      },
                    }}
                    margin={{ bottom: 20 }}
                  />
                </Paper>
              </Stack>
            </Box>
          </Box>

          {/* Gráfico Detallado (Barras Apiladas) */}
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Distribución de Grados por Dificultad
            </Typography>
            {barChartData.length > 0 ? (
              <BarChart
                dataset={barChartData}
                layout="horizontal"
                yAxis={[
                  {
                    scaleType: "band",
                    dataKey: "nombre",
                    label: "Dificultad",
                    tickLabelStyle: {
                      fontSize: 10,
                    },
                  },
                ]}
                xAxis={[
                  {
                    valueFormatter: (value: number | null) =>
                      value !== null && Number.isInteger(value)
                        ? value.toString()
                        : "",
                  },
                ]}
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
                height={500}
                margin={{ left: 200, right: 20 }}
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
    </Paper>
  );
}
