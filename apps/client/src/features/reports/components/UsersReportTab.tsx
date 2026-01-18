import { useState } from "react";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { roles, estado_simple } from "../../../types";
import {
  getUsersReport,
  type UsersReportFilters,
} from "../service/reports.service";

export default function UsersReportTab() {
  const [filters, setFilters] = useState<UsersReportFilters>({
    fechaDesde: "",
    fechaHasta: "",
    rol: "",
    estado: "",
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
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
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: "deletedAt",
      headerName: "Estado",
      flex: 0.8,
      valueGetter: (params) => (params.value ? "Inactivo" : "Activo"),
    },
  ];

  return (
    <Box>
      {/* Filtros */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid sx={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Fecha Desde"
                type="date"
                name="fechaDesde"
                value={filters.fechaDesde}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid sx={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Fecha Hasta"
                type="date"
                name="fechaHasta"
                value={filters.fechaHasta}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid sx={{ xs: 12, md: 2 }}>
              <TextField
                select
                fullWidth
                label="Rol"
                name="rol"
                value={filters.rol}
                onChange={handleChange}
                size="small"
              >
                <MenuItem value="">Todos</MenuItem>
                {Object.values(roles).map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid sx={{ xs: 12, md: 2 }}>
              <TextField
                select
                fullWidth
                label="Estado"
                name="estado"
                value={filters.estado}
                onChange={handleChange}
                size="small"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value={estado_simple.Activo}>Activo</MenuItem>
                <MenuItem value={estado_simple.Inactivo}>Inactivo</MenuItem>
              </TextField>
            </Grid>
            <Grid sx={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? "Generando..." : "Generar"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid sx={{ xs: 12, md: 3 }}>
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
            <Grid sx={{ xs: 12, md: 3 }}>
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
            <Grid sx={{ xs: 12, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Nuevos (Último Año)
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
            <Grid sx={{ xs: 12, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Bajas (Último Año)
                  </Typography>
                  <Typography variant="h4">
                    {reportData.variacionAnual.bajas.cantidad}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
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
