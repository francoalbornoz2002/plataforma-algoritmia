import { useState } from "react";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import { roles } from "../../../types";
import {
  getUsersReport,
  type UsersReportFilters,
} from "../service/reports.service";

export default function UsersReportTab() {
  const [filters, setFilters] = useState<UsersReportFilters>({
    fechaDesde: "",
    fechaHasta: "",
    rol: "",
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent,
  ) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name as string]: value });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsersReport(filters);
      setReportData(data);
    } catch (err: any) {
      setError("Error al generar el reporte. Intente nuevamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: "nombre", headerName: "Nombre", flex: 1 },
    { field: "apellido", headerName: "Apellido", flex: 1 },
    { field: "email", headerName: "Email", flex: 1.5 },
    { field: "rol", headerName: "Rol", flex: 0.8 },
    {
      field: "createdAt",
      headerName: "Fecha Alta",
      flex: 1,
      valueFormatter: (value: any) => new Date(value).toLocaleDateString(),
    },
    {
      field: "deletedAt",
      headerName: "Estado",
      flex: 0.8,
      align: "center",
      headerAlign: "center",
      valueGetter: (value: any) => (value ? "Inactivo" : "Activo"),
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === "Activo" ? "success" : "error"}
          variant="filled"
        />
      ),
    },
  ];

  return (
    <Box>
      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Filtros de reporte
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <DatePicker
            label="Fecha Desde"
            disableFuture
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
            disableFuture
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

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "..." : "Generar"}
          </Button>
        </Stack>
      </Paper>

      {/* Acciones de Exportación */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          disabled={!reportData}
          color="error"
        >
          Exportar PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<TableOnIcon />}
          disabled={!reportData}
          color="success"
        >
          Exportar Excel
        </Button>
      </Box>

      {/* Resultados */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!reportData && !loading && (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <Typography variant="h6">No hay datos para mostrar</Typography>
          <Typography>
            Selecciona los filtros y presiona "Generar" para ver el reporte.
          </Typography>
        </Box>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {reportData && (
        <Box>
          {/* KPIs */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Estado de Usuarios
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid sx={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Usuarios
                  </Typography>
                  <Typography variant="h4">
                    {reportData.resumen.total}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid sx={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Activos
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {reportData.resumen.activos}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid sx={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Inactivos
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {reportData.resumen.inactivos}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            Variación Anual (Últimos 12 meses)
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid sx={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Nuevos Usuarios (Altas)
                  </Typography>
                  <Typography variant="h4">
                    {reportData.variacionAnual.altas.cantidad}
                    <Typography
                      component="span"
                      variant="body2"
                      color={
                        reportData.variacionAnual.altas.variacionPct >= 0
                          ? "success.main"
                          : "error.main"
                      }
                      sx={{ ml: 1 }}
                    >
                      (
                      {reportData.variacionAnual.altas.variacionPct > 0
                        ? "+"
                        : ""}
                      {reportData.variacionAnual.altas.variacionPct}%)
                    </Typography>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid sx={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Usuarios dados de baja
                  </Typography>
                  <Typography variant="h4">
                    {reportData.variacionAnual.bajas.cantidad}
                    <Typography
                      component="span"
                      variant="body2"
                      color={
                        reportData.variacionAnual.bajas.variacionPct <= 0
                          ? "success.main"
                          : "error.main"
                      }
                      sx={{ ml: 1 }}
                    >
                      (
                      {reportData.variacionAnual.bajas.variacionPct > 0
                        ? "+"
                        : ""}
                      {reportData.variacionAnual.bajas.variacionPct}%)
                    </Typography>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            Distribución por Rol
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {reportData.resumen.porRol.map((rolData: any) => (
              <Grid key={rolData.rol} sx={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      {rolData.rol}
                    </Typography>
                    <Typography variant="h4">{rolData.cantidad}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Tabla */}
          <Paper sx={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={reportData.data}
              columns={columns}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
            />
          </Paper>
        </Box>
      )}
    </Box>
  );
}
