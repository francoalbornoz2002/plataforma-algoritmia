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
  IconButton,
  Tooltip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { LineChart } from "@mui/x-charts/LineChart";
import CategoryIcon from "@mui/icons-material/Category";
import {
  getCoursesHistory,
  type CoursesHistoryFilters,
} from "../../service/reports.service";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import HistoryIcon from "@mui/icons-material/History";
import HeaderReportPage from "../../../../components/HeaderReportPage";
import { datePickerConfig } from "../../../../config/theme.config";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";

export default function CoursesHistorySection() {
  const [type, setType] = useState<string>("TODOS");
  const [filters, setFilters] = useState<CoursesHistoryFilters>({
    fechaDesde: "",
    fechaHasta: "",
    tipoMovimiento: "TODOS" as any,
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{
    dates: string[];
    altas: number[];
    bajas: number[];
    finalizaciones: number[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar el tipo seleccionado con los filtros
  useEffect(() => {
    setFilters((prev) => ({ ...prev, tipoMovimiento: type as any }));
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
      const chartFinalizaciones = backendChartData.map(
        (d: any) => d.finalizaciones,
      );

      setChartData({
        dates,
        altas: chartAltas,
        bajas: chartBajas,
        finalizaciones: chartFinalizaciones,
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

  const handleClearFilters = () => {
    setFilters({
      fechaDesde: "",
      fechaHasta: "",
      tipoMovimiento: "TODOS" as any,
    });
    setType("TODOS");
  };

  const columns: GridColDef[] = [
    { field: "curso", headerName: "Curso", flex: 1, minWidth: 150 },
    {
      field: "tipo",
      headerName: "Movimiento",
      width: 140,
      renderCell: (params) => {
        let color: "primary" | "error" | "info" | "warning" | "default" =
          "default";
        if (params.value === "Alta") color = "primary";
        else if (params.value === "Baja") color = "error";
        else if (params.value === "Finalización") color = "warning";

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
          title="Historial de Movimientos de Cursos"
          description="Revisa el registro de altas, bajas y finalizaciones de cursos en el sistema."
          icon={<HistoryIcon />}
          filters={filters}
          endpointPathPdf="/reportes/cursos/historial/pdf"
          endpointPathExcel="/reportes/cursos/historial/excel"
          filenameExcel="historial_cursos.xlsx"
          disabled={data.length === 0}
        />

        <Stack spacing={2}>
          {/* Fila 1: Tipo de Movimiento */}
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <CategoryIcon color="action" />
            <Typography variant="subtitle2">Tipo de Movimiento:</Typography>
            <Chip
              label="Todos"
              onClick={() => setType("TODOS")}
              color="info"
              variant={type === "TODOS" ? "filled" : "outlined"}
              clickable
            />
            <Chip
              label="Altas"
              onClick={() => setType("ALTA")}
              color="primary"
              variant={type === "ALTA" ? "filled" : "outlined"}
              clickable
            />
            <Chip
              label="Bajas"
              onClick={() => setType("BAJA")}
              color="error"
              variant={type === "BAJA" ? "filled" : "outlined"}
              clickable
            />
            <Chip
              label="Finalizaciones"
              onClick={() => setType("FINALIZACION")}
              color="warning"
              variant={type === "FINALIZACION" ? "filled" : "outlined"}
              clickable
            />
          </Box>

          {/* Fila 2: Filtros Rápidos */}
          <QuickDateFilter onApply={handleQuickFilter} />

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
              {...datePickerConfig}
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
                    ...(type === "ALTA" || type === "TODOS"
                      ? [
                          {
                            data: chartData.altas,
                            label: "Altas",
                            color: "#1976d2",
                          },
                        ]
                      : []),
                    ...(type === "BAJA" || type === "TODOS"
                      ? [
                          {
                            data: chartData.bajas,
                            label: "Bajas",
                            color: "#d32f2f",
                          },
                        ]
                      : []),
                    ...(type === "FINALIZACION" || type === "TODOS"
                      ? [
                          {
                            data: chartData.finalizaciones,
                            label: "Finalizaciones",
                            color: "#ed6c02",
                          },
                        ]
                      : []),
                  ]}
                  height={350}
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
