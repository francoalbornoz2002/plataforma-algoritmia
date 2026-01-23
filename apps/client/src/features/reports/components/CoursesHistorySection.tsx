// apps/client/src/features/reports/components/CoursesHistorySection.tsx

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
  Tooltip,
  IconButton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import InfoIcon from "@mui/icons-material/Info";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { LineChart } from "@mui/x-charts/LineChart";
import {
  getCoursesHistory,
  TipoMovimientoCurso,
  type CoursesHistoryFilters,
} from "../service/reports.service";

export default function CoursesHistorySection() {
  const [type, setType] = useState<TipoMovimientoCurso>(
    TipoMovimientoCurso.TODOS,
  );
  const [filters, setFilters] = useState<CoursesHistoryFilters>({
    fechaDesde: "",
    fechaHasta: "",
    tipoMovimiento: TipoMovimientoCurso.TODOS,
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{
    dates: string[];
    altas: number[];
    bajas: number[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar el tipo seleccionado con los filtros
  useEffect(() => {
    setFilters((prev) => ({ ...prev, tipoMovimiento: type }));
  }, [type]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const events = await getCoursesHistory(filters);

      // Agregamos un ID único para el DataGrid y procesamos fechas
      const rows = events.map((ev: any, index: number) => ({
        ...ev,
        id: `${ev.tipo}-${index}`, // ID único compuesto
      }));
      setData(rows);

      // Procesar datos para el gráfico (Agrupar por fecha)
      const stats: Record<string, { altas: number; bajas: number }> = {};

      events.forEach((ev: any) => {
        const dateStr = new Date(ev.fecha).toISOString().split("T")[0];
        if (!stats[dateStr]) stats[dateStr] = { altas: 0, bajas: 0 };

        if (ev.tipo === "Alta") stats[dateStr].altas++;
        else if (ev.tipo === "Baja") stats[dateStr].bajas++;
      });

      // Ordenar fechas ascendentemente para el gráfico
      const sortedDates = Object.keys(stats).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
      );

      setChartData({
        dates: sortedDates,
        altas: sortedDates.map((d) => stats[d].altas),
        bajas: sortedDates.map((d) => stats[d].bajas),
      });
    } catch (err) {
      console.error(err);
      setError("Error al cargar el historial de cursos.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al cambiar filtros
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const applyQuickFilter = (range: "week" | "month" | "year") => {
    const end = new Date();
    const start = new Date();
    if (range === "week") start.setDate(end.getDate() - 7);
    else if (range === "month") start.setMonth(end.getMonth() - 1);
    else if (range === "year") start.setFullYear(end.getFullYear(), 0, 1);

    setFilters((prev) => ({
      ...prev,
      fechaDesde: format(start, "yyyy-MM-dd"),
      fechaHasta: format(end, "yyyy-MM-dd"),
    }));
  };

  const columns: GridColDef[] = [
    { field: "curso", headerName: "Curso", flex: 1, minWidth: 150 },
    {
      field: "tipo",
      headerName: "Movimiento",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "Alta" ? "primary" : "error"}
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
    {
      field: "detalle",
      headerName: "Detalle",
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => {
        if (!params.value || params.value === "-") return "-";
        // Si es un objeto (Detalle de Alta con docentes y días)
        if (typeof params.value === "object") {
          return (
            <Stack spacing={0.5} sx={{ py: 1 }}>
              {params.value.docentes ? (
                <Typography variant="caption" display="block">
                  <strong>Docentes al momento de la creación:</strong>{" "}
                  {params.value.docentes}
                </Typography>
              ) : (
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                >
                  <em>Sin docentes asignados al crear</em>
                </Typography>
              )}
              <Typography variant="caption" display="block">
                <strong>Días de clase:</strong> {params.value.dias || "-"}
              </Typography>
            </Stack>
          );
        }
        return params.value;
      },
    },
  ];

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
      >
        Historial de Movimientos de Cursos
      </Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          {/* Fila Superior: Tipo de Movimiento y Filtros Rápidos */}
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
                    type === TipoMovimientoCurso.TODOS
                      ? "contained"
                      : "outlined"
                  }
                  onClick={() => setType(TipoMovimientoCurso.TODOS)}
                  color="info"
                >
                  Todos
                </Button>
                <Button
                  variant={
                    type === TipoMovimientoCurso.ALTA ? "contained" : "outlined"
                  }
                  onClick={() => setType(TipoMovimientoCurso.ALTA)}
                  color="primary"
                >
                  Altas
                </Button>
                <Button
                  variant={
                    type === TipoMovimientoCurso.BAJA ? "contained" : "outlined"
                  }
                  onClick={() => setType(TipoMovimientoCurso.BAJA)}
                  color="error"
                >
                  Bajas
                </Button>
              </ButtonGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Filtros Rápidos de Tiempo
              </Typography>
              <ButtonGroup variant="outlined" size="small">
                <Button onClick={() => applyQuickFilter("week")}>
                  Última Semana
                </Button>
                <Button onClick={() => applyQuickFilter("month")}>
                  Último Mes
                </Button>
                <Button onClick={() => applyQuickFilter("year")}>
                  Este Año
                </Button>
              </ButtonGroup>
            </Box>
          </Stack>

          <Divider />

          {/* Fila Inferior: Selectores de Fecha */}
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
          </Stack>
        </Stack>
      </Paper>

      {/* Acciones Exportar */}
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
        {/* Tabla (Izquierda) */}
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

        {/* Gráfico (Derecha) */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {chartData && chartData.dates.length > 0 ? (
            <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Evolución en el tiempo
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
                  ...(type === TipoMovimientoCurso.ALTA ||
                  type === TipoMovimientoCurso.TODOS
                    ? [
                        {
                          data: chartData.altas,
                          label: "Altas",
                          color: "#1976d2",
                        },
                      ]
                    : []),
                  ...(type === TipoMovimientoCurso.BAJA ||
                  type === TipoMovimientoCurso.TODOS
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
