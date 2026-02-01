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
  getUsersAltas,
  getUsersBajas,
  type UsersHistoryFilters,
} from "../../service/reports.service";
import QuickDateFilter from "../../../../components/QuickDateFilter";

export default function HistoryReportSection() {
  const [type, setType] = useState<"altas" | "bajas" | "todos">("todos");
  const [filters, setFilters] = useState<UsersHistoryFilters>({
    fechaDesde: "",
    fechaHasta: "",
    rol: "",
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{
    dates: string[];
    altas: number[];
    bajas: number[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos al montar y al cambiar filtros o tipo
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, type]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      let altasData: any[] = [];
      let bajasData: any[] = [];
      let altasMeta: any[] = [];
      let bajasMeta: any[] = [];

      if (type === "altas" || type === "todos") {
        const res = await getUsersAltas(filters);
        altasData = res.data.map((u: any) => ({
          ...u,
          tipoMovimiento: "Alta",
          fechaMovimiento: u.createdAt,
        }));
        altasMeta = res.meta || [];
      }

      if (type === "bajas" || type === "todos") {
        const res = await getUsersBajas(filters);
        bajasData = res.data.map((u: any) => ({
          ...u,
          tipoMovimiento: "Baja",
          fechaMovimiento: u.deletedAt,
        }));
        bajasMeta = res.meta || [];
      }

      // Combinar datos para la tabla
      const combinedData = [...altasData, ...bajasData].sort(
        (a, b) =>
          new Date(a.fechaMovimiento).getTime() -
          new Date(b.fechaMovimiento).getTime(),
      );

      // Agregar ID único para DataGrid
      const tableRows = combinedData.map((item, index) => ({
        ...item,
        rowId: `${item.id}-${item.tipoMovimiento}-${index}`,
      }));

      setData(tableRows);

      // Preparar datos para el gráfico
      const allDatesSet = new Set<string>();
      altasMeta.forEach((m: any) => allDatesSet.add(m.fecha));
      bajasMeta.forEach((m: any) => allDatesSet.add(m.fecha));

      const sortedDates = Array.from(allDatesSet).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
      );

      const chartAltas = sortedDates.map((date) => {
        const found = altasMeta.find((m: any) => m.fecha === date);
        return found ? found.cantidad : 0;
      });
      const chartBajas = sortedDates.map((date) => {
        const found = bajasMeta.find((m: any) => m.fecha === date);
        return found ? found.cantidad : 0;
      });

      setChartData({
        dates: sortedDates,
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
                  variant={type === "todos" ? "contained" : "outlined"}
                  onClick={() => setType("todos")}
                  color="info"
                >
                  Todos
                </Button>
                <Button
                  variant={type === "altas" ? "contained" : "outlined"}
                  onClick={() => setType("altas")}
                  color="primary"
                >
                  Altas
                </Button>
                <Button
                  variant={type === "bajas" ? "contained" : "outlined"}
                  onClick={() => setType("bajas")}
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
                  ...(type === "altas" || type === "todos"
                    ? [
                        {
                          data: chartData.altas,
                          label: "Altas",
                          color: "#1976d2",
                        },
                      ]
                    : []),
                  ...(type === "bajas" || type === "todos"
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
