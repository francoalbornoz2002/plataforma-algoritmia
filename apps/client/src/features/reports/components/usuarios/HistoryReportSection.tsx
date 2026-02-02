import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
  Paper,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  type SelectChangeEvent,
  Divider,
  ButtonGroup,
  MenuItem,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { roles } from "../../../../types";
import { LineChart } from "@mui/x-charts/LineChart";
import {
  getUsersHistory,
  getUsersHistoryPdf,
  type UsersHistoryFilters,
  TipoMovimientoUsuario,
} from "../../service/reports.service";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import ReportExportDialog from "../common/ReportExportDialog";

export default function HistoryReportSection() {
  const [type, setType] = useState<TipoMovimientoUsuario>(
    TipoMovimientoUsuario.TODOS,
  );
  const [filters, setFilters] = useState<UsersHistoryFilters>({
    fechaDesde: "",
    fechaHasta: "",
    rol: "",
    tipoMovimiento: TipoMovimientoUsuario.TODOS,
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{
    dates: string[];
    altas: number[];
    bajas: number[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estado para el Modal de Exportación
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Cargar datos al montar y al cambiar filtros o tipo
  useEffect(() => {
    setFilters((prev) => ({ ...prev, tipoMovimiento: type }));
  }, [type]);

  useEffect(() => {
    handleGenerate();
  }, [filters]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUsersHistory(filters);

      // Agregar ID único para DataGrid
      const tableRows = result.history.map((item: any, index: number) => ({
        ...item,
        // Mapeamos 'fecha' a 'fechaMovimiento' para la columna
        fechaMovimiento: item.fecha,
        rowId: `${item.id}-${item.tipoMovimiento}-${index}`,
      }));

      setData(tableRows);

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
      setError("Error al generar el reporte histórico.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFilter = (start: string, end: string) => {
    setFilters({
      ...filters,
      fechaDesde: start,
      fechaHasta: end,
    });
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent,
  ) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name as string]: value });
  };

  const handleOpenExportDialog = () => {
    setIsExportDialogOpen(true);
  };

  const handleExportPdf = async (aPresentarA: string) => {
    setPdfLoading(true);
    try {
      const params = { ...filters, aPresentarA };
      const blob = await getUsersHistoryPdf(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "historial-usuarios.pdf");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      setIsExportDialogOpen(false);
    } catch (err) {
      console.error(err);
      setError("Error al descargar el PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: "nombre", headerName: "Nombre", flex: 1, minWidth: 100 },
    { field: "apellido", headerName: "Apellido", flex: 1, minWidth: 100 },
    { field: "rol", headerName: "Rol", flex: 0.8, minWidth: 90 },
    {
      field: "tipoMovimiento",
      headerName: "Tipo",
      flex: 0.7,
      minWidth: 80,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === "Alta" ? "primary" : "error"}
          variant="outlined"
        />
      ),
    },
    {
      field: "fechaMovimiento",
      headerName: "Fecha",
      flex: 1,
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
        Historial de Movimientos
      </Typography>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          {/* Fila Superior: Tipo de Reporte y Filtros Rápidos */}

          {/* Filtros */}
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
                    type === TipoMovimientoUsuario.TODOS
                      ? "contained"
                      : "outlined"
                  }
                  onClick={() => setType(TipoMovimientoUsuario.TODOS)}
                  color="info"
                >
                  Todos
                </Button>
                <Button
                  variant={
                    type === TipoMovimientoUsuario.ALTA
                      ? "contained"
                      : "outlined"
                  }
                  onClick={() => setType(TipoMovimientoUsuario.ALTA)}
                  color="primary"
                >
                  Altas
                </Button>
                <Button
                  variant={
                    type === TipoMovimientoUsuario.BAJA
                      ? "contained"
                      : "outlined"
                  }
                  onClick={() => setType(TipoMovimientoUsuario.BAJA)}
                  color="error"
                >
                  Bajas
                </Button>
              </ButtonGroup>
            </Box>

            <QuickDateFilter onApply={handleQuickFilter} />
          </Stack>
          <Divider />
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
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Rol</InputLabel>
              <Select
                label="Rol"
                name="rol"
                value={filters.rol}
                onChange={handleChange}
              >
                <MenuItem value="">Todos</MenuItem>
                {Object.values(roles).map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Paper>

      {/* Acciones Exportar */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          disabled={data.length === 0 || pdfLoading}
          color="error"
          onClick={handleOpenExportDialog}
        >
          {pdfLoading ? "Generando..." : "Exportar PDF"}
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
              getRowId={(row) => row.rowId}
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
                  ...(type === TipoMovimientoUsuario.ALTA ||
                  type === TipoMovimientoUsuario.TODOS
                    ? [
                        {
                          data: chartData.altas,
                          label: "Altas",
                          color: "#1976d2",
                        },
                      ]
                    : []),
                  ...(type === TipoMovimientoUsuario.BAJA ||
                  type === TipoMovimientoUsuario.TODOS
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

      {/* Modal de Exportación */}
      <ReportExportDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={handleExportPdf}
        isGenerating={pdfLoading}
      />
    </Paper>
  );
}
