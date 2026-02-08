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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { LineChart } from "@mui/x-charts/LineChart";
import {
  getCoursesHistory,
  TipoMovimientoCurso,
  type CoursesHistoryFilters,
} from "../../service/reports.service";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import PdfExportButton from "../common/PdfExportButton";
import ExcelExportButton from "../common/ExcelExportButton";

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
      const result = await getCoursesHistory(filters);

      // Agregamos un ID único para el DataGrid y procesamos fechas
      const rows = result.history.map((ev: any, index: number) => ({
        ...ev,
        id: `${ev.tipo}-${index}`, // ID único compuesto
      }));
      setData(rows);

      // Usamos los datos del gráfico que vienen del backend
      const backendChartData = result.chartData || [];
      const dates = backendChartData.map((d: any) => d.fecha);
      const chartAltas = backendChartData.map((d: any) => d.altas);
      const chartBajas = backendChartData.map((d: any) => d.bajas);

      setChartData({
        dates,
        altas: chartAltas,
        bajas: chartBajas,
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

  const handleQuickFilter = (start: string, end: string) => {
    setFilters((prev) => ({
      ...prev,
      fechaDesde: start,
      fechaHasta: end,
    }));
  };

  const columns: GridColDef[] = [
    { field: "curso", headerName: "Curso", flex: 1, minWidth: 150 },
    {
      field: "tipo",
      headerName: "Movimiento",
      width: 140,
      renderCell: (params) => {
        let color: "primary" | "error" | "info" | "default" = "default";
        if (params.value === "Alta") color = "primary";
        else if (params.value === "Baja") color = "error";
        else if (params.value === "Finalización") color = "info";

        return (
          <Chip
            label={params.value}
            color={color}
            size="small"
            variant="outlined"
          />
        );
      },
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

            <QuickDateFilter onApply={handleQuickFilter} />
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
        <PdfExportButton
          filters={filters}
          endpointPath="/reportes/cursos/historial/pdf"
          disabled={data.length === 0}
        />
        <ExcelExportButton
          filters={filters}
          endpointPath="/reportes/cursos/historial/excel"
          disabled={data.length === 0}
          filename="historial_cursos.xlsx"
        />
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
