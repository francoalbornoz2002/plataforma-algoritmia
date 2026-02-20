// apps/client/src/features/reports/components/StudentEnrollmentHistorySection.tsx

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Alert,
  Paper,
  Chip,
  Stack,
  Divider,
  Autocomplete,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import CategoryIcon from "@mui/icons-material/Category";
import { LineChart } from "@mui/x-charts/LineChart";
import {
  getStudentEnrollmentHistory,
  getCoursesSummary,
  TipoMovimientoInscripcion,
  type StudentEnrollmentHistoryFilters,
} from "../../service/reports.service";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import HistoryIcon from "@mui/icons-material/History";
import HeaderReportPage from "../../../../components/HeaderReportPage";
import { datePickerConfig } from "../../../../config/theme.config";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";

export default function StudentEnrollmentHistorySection() {
  const [type, setType] = useState<TipoMovimientoInscripcion>(
    TipoMovimientoInscripcion.TODOS,
  );
  const [filters, setFilters] = useState<StudentEnrollmentHistoryFilters>({
    fechaDesde: "",
    fechaHasta: "",
    cursoId: "",
    tipoMovimiento: TipoMovimientoInscripcion.TODOS,
  });

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{
    dates: string[];
    inscripciones: number[];
    bajas: number[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de cursos para el filtro
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const result = await getCoursesSummary({});
        setCourses(result.lista || []);
      } catch (err) {
        console.error("Error cargando cursos", err);
      }
    };
    loadCourses();
  }, []);

  // Sincronizar el tipo seleccionado con los filtros
  useEffect(() => {
    setFilters((prev) => ({ ...prev, tipoMovimiento: type }));
  }, [type]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const events = await getStudentEnrollmentHistory(filters);

      // Agregamos un ID único para el DataGrid
      const rows = events.map((ev: any, index: number) => ({
        ...ev,
        id: `${ev.tipo}-${index}`,
      }));
      setData(rows);

      // Procesar datos para el gráfico
      const stats: Record<string, { inscripciones: number; bajas: number }> =
        {};

      events.forEach((ev: any) => {
        const dateStr = new Date(ev.fecha).toISOString().split("T")[0];
        if (!stats[dateStr]) stats[dateStr] = { inscripciones: 0, bajas: 0 };

        if (ev.tipo === "Inscripción") stats[dateStr].inscripciones++;
        else if (ev.tipo === "Baja") stats[dateStr].bajas++;
      });

      const sortedDates = Object.keys(stats).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
      );

      setChartData({
        dates: sortedDates,
        inscripciones: sortedDates.map((d) => stats[d].inscripciones),
        bajas: sortedDates.map((d) => stats[d].bajas),
      });
    } catch (err) {
      console.error(err);
      setError("Error al cargar el historial de alumnos.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al cambiar filtros
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleQuickFilter = (start: string, end: string) => {
    setFilters((prev) => ({
      ...prev,
      fechaDesde: start,
      fechaHasta: end,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      fechaDesde: "",
      fechaHasta: "",
      cursoId: "",
      tipoMovimiento: TipoMovimientoInscripcion.TODOS,
    });
    setType(TipoMovimientoInscripcion.TODOS);
  };

  const columns: GridColDef[] = [
    { field: "alumno", headerName: "Alumno", flex: 1, minWidth: 150 },
    { field: "curso", headerName: "Curso", flex: 1, minWidth: 150 },
    {
      field: "tipo",
      headerName: "Movimiento",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "Inscripción" ? "success" : "error"}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "fecha",
      headerName: "Fecha",
      width: 120,
      valueFormatter: (value: any) =>
        value ? new Date(value).toLocaleDateString() : "-",
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
          title="Historial de Inscripciones y Bajas"
          description="Revisa el registro de alumnos inscritos y bajas procesadas en los cursos."
          icon={<HistoryIcon />}
          filters={filters}
          endpointPathPdf="/reportes/cursos/historial-inscripciones/pdf"
          endpointPathExcel="/reportes/cursos/historial-inscripciones/excel"
          filenameExcel="historial_inscripciones.xlsx"
          disabled={data.length === 0}
        />

        <Stack spacing={2}>
          {/* Fila 1: Tipo de Movimiento */}
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <CategoryIcon color="action" />
            <Typography variant="subtitle2">Tipo de Movimiento:</Typography>
            <Chip
              label="Todos"
              onClick={() => setType(TipoMovimientoInscripcion.TODOS)}
              color="info"
              variant={
                type === TipoMovimientoInscripcion.TODOS ? "filled" : "outlined"
              }
              clickable
            />
            <Chip
              label="Inscripciones"
              onClick={() => setType(TipoMovimientoInscripcion.INSCRIPCION)}
              color="success"
              variant={
                type === TipoMovimientoInscripcion.INSCRIPCION
                  ? "filled"
                  : "outlined"
              }
              clickable
            />
            <Chip
              label="Bajas"
              onClick={() => setType(TipoMovimientoInscripcion.BAJA)}
              color="error"
              variant={
                type === TipoMovimientoInscripcion.BAJA ? "filled" : "outlined"
              }
              clickable
            />
          </Box>

          {/* Fila 2: Filtros Rápidos */}
          <QuickDateFilter onApply={handleQuickFilter} />

          <Divider />

          {/* Fila Inferior: Fechas y Curso */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
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
              onChange={(value) =>
                setFilters({
                  ...filters,
                  fechaDesde: value ? format(value, "yyyy-MM-dd") : "",
                })
              }
              slotProps={{
                textField: {
                  ...datePickerConfig.slotProps.textField,
                  InputProps: {
                    sx: {
                      ...datePickerConfig.slotProps.textField.InputProps.sx,
                      minWidth: 180,
                    },
                  },
                  sx: { minWidth: 180 },
                },
              }}
            />
            <DatePicker
              label="Fecha Hasta"
              value={
                filters.fechaHasta
                  ? new Date(filters.fechaHasta + "T00:00:00")
                  : null
              }
              minDate={
                filters.fechaDesde
                  ? new Date(filters.fechaDesde + "T00:00:00")
                  : undefined
              }
              onChange={(value) =>
                setFilters({
                  ...filters,
                  fechaHasta: value ? format(value, "yyyy-MM-dd") : "",
                })
              }
              slotProps={{
                textField: {
                  ...datePickerConfig.slotProps.textField,
                  InputProps: {
                    sx: {
                      ...datePickerConfig.slotProps.textField.InputProps.sx,
                      minWidth: 180,
                    },
                  },
                  sx: { minWidth: 180 },
                },
              }}
            />

            <Autocomplete
              options={courses}
              getOptionLabel={(option) => option.nombre}
              value={courses.find((c) => c.id === filters.cursoId) || null}
              onChange={(event, newValue) => {
                setFilters({
                  ...filters,
                  cursoId: newValue ? newValue.id : "",
                });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Filtrar por Curso" size="small" />
              )}
              sx={{ minWidth: 250 }}
            />
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
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{ width: "100%" }}
        >
          {/* Tabla */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Paper elevation={3} sx={{ height: 450, width: "100%" }}>
              <DataGrid
                rows={data}
                columns={columns}
                loading={loading}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                density="compact"
              />
            </Paper>
          </Box>

          {/* Gráfico */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {chartData && chartData.dates.length > 0 ? (
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <Typography variant="h6" gutterBottom>
                  Evolución de Inscripciones
                </Typography>
                <LineChart
                  xAxis={[
                    {
                      scaleType: "point",
                      data: chartData.dates,
                      label: "Fecha",
                      valueFormatter: (date) =>
                        new Date(date).toLocaleDateString(),
                    },
                  ]}
                  series={[
                    ...(type === TipoMovimientoInscripcion.INSCRIPCION ||
                    type === TipoMovimientoInscripcion.TODOS
                      ? [
                          {
                            data: chartData.inscripciones,
                            label: "Inscripciones",
                            color: "#2e7d32",
                          },
                        ]
                      : []),
                    ...(type === TipoMovimientoInscripcion.BAJA ||
                    type === TipoMovimientoInscripcion.TODOS
                      ? [
                          {
                            data: chartData.bajas,
                            label: "Bajas",
                            color: "#d32f2f",
                          },
                        ]
                      : []),
                  ]}
                  height={350}
                  margin={{ left: 30, right: 30, top: 30, bottom: 30 }}
                />
              </Paper>
            ) : (
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                }}
              >
                <Typography>No hay datos para mostrar en el gráfico</Typography>
              </Paper>
            )}
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
