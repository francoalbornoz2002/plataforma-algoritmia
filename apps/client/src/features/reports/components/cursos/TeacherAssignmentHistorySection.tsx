// apps/client/src/features/reports/components/TeacherAssignmentHistorySection.tsx

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
  Paper,
  Chip,
  Stack,
  Divider,
  ButtonGroup,
  Autocomplete,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { LineChart } from "@mui/x-charts/LineChart";
import {
  getTeacherAssignmentHistory,
  getCoursesList,
  TipoMovimientoAsignacion,
  type TeacherAssignmentHistoryFilters,
} from "../../service/reports.service";
import QuickDateFilter from "../../../../components/QuickDateFilter";

export default function TeacherAssignmentHistorySection() {
  const [type, setType] = useState<TipoMovimientoAsignacion>(
    TipoMovimientoAsignacion.TODOS,
  );
  const [filters, setFilters] = useState<TeacherAssignmentHistoryFilters>({
    fechaDesde: "",
    fechaHasta: "",
    cursoId: "",
    tipoMovimiento: TipoMovimientoAsignacion.TODOS,
  });

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{
    dates: string[];
    asignaciones: number[];
    bajas: number[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de cursos para el filtro
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const list = await getCoursesList({});
        setCourses(list);
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
      const events = await getTeacherAssignmentHistory(filters);

      // Agregamos un ID único para el DataGrid
      const rows = events.map((ev: any, index: number) => ({
        ...ev,
        id: `${ev.tipo}-${index}`,
      }));
      setData(rows);

      // Procesar datos para el gráfico
      const stats: Record<string, { asignaciones: number; bajas: number }> = {};

      events.forEach((ev: any) => {
        const dateStr = new Date(ev.fecha).toISOString().split("T")[0];
        if (!stats[dateStr]) stats[dateStr] = { asignaciones: 0, bajas: 0 };

        if (ev.tipo === "Asignación") stats[dateStr].asignaciones++;
        else if (ev.tipo === "Baja") stats[dateStr].bajas++;
      });

      const sortedDates = Object.keys(stats).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
      );

      setChartData({
        dates: sortedDates,
        asignaciones: sortedDates.map((d) => stats[d].asignaciones),
        bajas: sortedDates.map((d) => stats[d].bajas),
      });
    } catch (err) {
      console.error(err);
      setError("Error al cargar el historial de docentes.");
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

  const columns: GridColDef[] = [
    { field: "docente", headerName: "Docente", flex: 1, minWidth: 150 },
    { field: "curso", headerName: "Curso", flex: 1, minWidth: 150 },
    {
      field: "tipo",
      headerName: "Movimiento",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "Asignación" ? "success" : "error"}
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
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
      >
        Historial de Asignaciones y Bajas de Docentes
      </Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          {/* Fila Superior */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Tipo de Movimiento
              </Typography>
              <ButtonGroup size="small">
                <Button
                  variant={
                    type === TipoMovimientoAsignacion.TODOS
                      ? "contained"
                      : "outlined"
                  }
                  onClick={() => setType(TipoMovimientoAsignacion.TODOS)}
                  color="info"
                >
                  Todos
                </Button>
                <Button
                  variant={
                    type === TipoMovimientoAsignacion.ASIGNACION
                      ? "contained"
                      : "outlined"
                  }
                  onClick={() => setType(TipoMovimientoAsignacion.ASIGNACION)}
                  color="success"
                >
                  Asignaciones
                </Button>
                <Button
                  variant={
                    type === TipoMovimientoAsignacion.BAJA
                      ? "contained"
                      : "outlined"
                  }
                  onClick={() => setType(TipoMovimientoAsignacion.BAJA)}
                  color="error"
                >
                  Bajas
                </Button>
              </ButtonGroup>
            </Box>

            <QuickDateFilter onApply={handleQuickFilter} />
          </Stack>

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
              slotProps={{ textField: { size: "small" } }}
              sx={{ minWidth: 180 }}
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
              slotProps={{ textField: { size: "small" } }}
              sx={{ minWidth: 180 }}
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
          </Stack>
        </Stack>
      </Paper>

      {/* Acciones */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          disabled={data.length === 0}
          color="error"
        >
          Exportar PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<TableOnIcon />}
          disabled={data.length === 0}
          color="success"
        >
          Exportar Excel
        </Button>
      </Box>

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
                Evolución de Asignaciones
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
                  ...(type === TipoMovimientoAsignacion.ASIGNACION ||
                  type === TipoMovimientoAsignacion.TODOS
                    ? [
                        {
                          data: chartData.asignaciones,
                          label: "Asignaciones",
                          color: "#2e7d32",
                        },
                      ]
                    : []),
                  ...(type === TipoMovimientoAsignacion.BAJA ||
                  type === TipoMovimientoAsignacion.TODOS
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
              <Typography>Genera el reporte para ver el gráfico</Typography>
            </Paper>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
