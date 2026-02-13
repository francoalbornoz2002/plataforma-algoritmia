// apps/client/src/features/reports/components/CoursesSummarySection.tsx

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Alert,
  Paper,
  Stack,
  Divider,
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { BarChart } from "@mui/x-charts/BarChart";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
  getCoursesSummary,
  type CoursesSummaryFilters,
} from "../../service/reports.service";
import EstadoCursoChip from "../../../../components/EstadoCursoChip";
import { datePickerConfig } from "../../../../config/theme.config";
import HeaderReportPage from "../../../../components/HeaderReportPage";
import AssessmentIcon from "@mui/icons-material/Assessment";

export default function CoursesSummarySection() {
  const [filters, setFilters] = useState<CoursesSummaryFilters>({
    fechaCorte: "",
    search: "",
    estado: "",
  });
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Estado para el filtro interactivo del gráfico (local)
  const [chartFilter, setChartFilter] = useState<{
    estado?: string;
  } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      // Consultamos todo en una sola llamada (KPIs + Lista)
      const result = await getCoursesSummary(filters);

      setSummaryData(result.kpis);
      setCoursesList(result.lista);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el resumen de cursos.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar y al cambiar filtros
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.fechaCorte]);

  // Filtrado local de la tabla basado en el click del gráfico
  const filteredCourses = useMemo(() => {
    if (!chartFilter?.estado) return coursesList;
    return coursesList.filter((course) => course.estado === chartFilter.estado);
  }, [coursesList, chartFilter]);

  // Configuración del Gráfico
  const chartConfig = useMemo(() => {
    if (!summaryData) return null;

    const dataset = [
      {
        category: "Total",
        Activo: summaryData.activos,
        Inactivo: summaryData.inactivos,
        Finalizado: summaryData.finalizados,
      },
    ];

    return {
      dataset,
      xAxis: [
        {
          scaleType: "band" as const,
          dataKey: "category",
        },
      ],
      series: [
        {
          dataKey: "Activo",
          label: "Activo",
          id: "Activo",
          color: "#2e7d32",
          valueFormatter: (value: number | null) =>
            value !== null
              ? `${value} (${((value / summaryData.total) * 100).toFixed(1)}%)`
              : "",
        },
        {
          dataKey: "Inactivo",
          label: "Inactivo",
          id: "Inactivo",
          color: "#d32f2f",
          valueFormatter: (value: number | null) =>
            value !== null
              ? `${value} (${((value / summaryData.total) * 100).toFixed(1)}%)`
              : "",
        },
        {
          dataKey: "Finalizado",
          label: "Finalizado",
          id: "Finalizado",
          color: "#0288d1", // Azul info
          valueFormatter: (value: number | null) =>
            value !== null
              ? `${value} (${((value / summaryData.total) * 100).toFixed(1)}%)`
              : "",
        },
      ],
    };
  }, [summaryData]);

  const handleItemClick = (event: any, identifier: any) => {
    if (!identifier) return;
    const { seriesId } = identifier;
    if (typeof seriesId === "string") {
      setChartFilter({ estado: seriesId });
    }
  };

  const columns: GridColDef[] = [
    { field: "nombre", headerName: "Curso", flex: 1.5, minWidth: 150 },
    {
      field: "estado",
      headerName: "Estado",
      width: 120,
      renderCell: (params) => <EstadoCursoChip estado={params.value} small />,
    },
    {
      field: "alumnosActivos",
      headerName: "Alumnos (Act)",
      width: 120,
      valueGetter: (params, row) => row.alumnos?.activos || 0,
    },
    {
      field: "docentesActivos",
      headerName: "Docentes (Act)",
      width: 120,
      valueGetter: (params, row) => row.docentes?.activos || 0,
    },
    {
      field: "createdAt",
      headerName: "Fecha Creación",
      width: 150,
      valueFormatter: (value: any) =>
        value ? format(new Date(value), "dd/MM/yyyy") : "-",
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
          title="Resumen de Cursos"
          description="Consulta la distribución y el estado general de todos los cursos de la plataforma."
          icon={<AssessmentIcon />}
          filters={filters}
          endpointPathPdf="/reportes/cursos/resumen/pdf"
          endpointPathExcel="/reportes/cursos/resumen/excel"
          filenameExcel="resumen_cursos.xlsx"
          disabled={!summaryData}
        />

        {/* Filtros */}
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <DatePicker
            label="Fecha de Corte (Opcional)"
            disableFuture
            value={
              filters.fechaCorte
                ? new Date(filters.fechaCorte + "T00:00:00")
                : null
            }
            onChange={(value) =>
              setFilters({
                ...filters,
                fechaCorte: value ? format(value, "yyyy-MM-dd") : "",
              })
            }
            {...datePickerConfig}
            slotProps={{
              textField: {
                ...datePickerConfig.slotProps.textField,
                InputProps: {
                  sx: {
                    ...datePickerConfig.slotProps.textField.InputProps.sx,
                    minWidth: 200,
                  },
                },
                sx: { minWidth: 200 },
              },
            }}
          />
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {summaryData && (
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            sx={{ width: "100%" }}
          >
            {/* Izquierda: KPIs y Gráfico */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={2} sx={{ height: "100%" }}>
                {/* Columna KPIs */}
                <Paper elevation={3} sx={{ p: 2, minWidth: 140 }}>
                  <Stack
                    spacing={3}
                    justifyContent="center"
                    alignItems="center"
                    sx={{ height: "100%" }}
                  >
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Total
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {summaryData.total}
                      </Typography>
                    </Box>
                    <Divider flexItem />
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Activos
                      </Typography>
                      <Typography
                        variant="h4"
                        color="success.main"
                        fontWeight="bold"
                      >
                        {summaryData.activos}
                      </Typography>
                      <Typography variant="caption" color="success.main">
                        {summaryData.total > 0
                          ? `${((summaryData.activos / summaryData.total) * 100).toFixed(1)}%`
                          : "0%"}
                      </Typography>
                    </Box>
                    <Divider flexItem />
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Inactivos
                      </Typography>
                      <Typography
                        variant="h4"
                        color="error.main"
                        fontWeight="bold"
                      >
                        {summaryData.inactivos}
                      </Typography>
                      <Typography variant="caption" color="error.main">
                        {summaryData.total > 0
                          ? `${((summaryData.inactivos / summaryData.total) * 100).toFixed(1)}%`
                          : "0%"}
                      </Typography>
                    </Box>
                    <Divider flexItem />
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Finalizados
                      </Typography>
                      <Typography
                        variant="h4"
                        color="info.main"
                        fontWeight="bold"
                      >
                        {summaryData.finalizados}
                      </Typography>
                      <Typography variant="caption" color="info.main">
                        {summaryData.total > 0
                          ? `${((summaryData.finalizados / summaryData.total) * 100).toFixed(1)}%`
                          : "0%"}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* Gráfico */}
                {chartConfig && (
                  <Paper elevation={3} sx={{ p: 2, flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" gutterBottom>
                      Distribución
                    </Typography>
                    <BarChart
                      dataset={chartConfig.dataset}
                      xAxis={chartConfig.xAxis}
                      series={chartConfig.series}
                      height={350}
                      onItemClick={handleItemClick}
                      margin={{ left: 50, right: 50, top: 50, bottom: 50 }}
                    />
                  </Paper>
                )}
              </Stack>
            </Box>

            {/* Derecha: Tabla de Cursos */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6">Detalle de Cursos</Typography>
                  {chartFilter && (
                    <Chip
                      label={`Filtro: ${chartFilter.estado}`}
                      onDelete={() => setChartFilter(null)}
                      color="primary"
                      size="small"
                    />
                  )}
                </Stack>
                <Box sx={{ flex: 1, width: "100%", minHeight: 400 }}>
                  <DataGrid
                    rows={filteredCourses}
                    columns={columns}
                    loading={loading}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                    density="compact"
                    sx={{ height: "100%" }}
                  />
                </Box>
              </Paper>
            </Box>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
