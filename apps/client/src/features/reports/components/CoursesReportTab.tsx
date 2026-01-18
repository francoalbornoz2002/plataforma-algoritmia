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
import { estado_simple } from "../../../types";
import {
  getCoursesReport,
  type CoursesReportFilters,
} from "../service/reports.service";

export default function CoursesReportTab() {
  const [filters, setFilters] = useState<CoursesReportFilters>({
    fechaDesde: "",
    fechaHasta: "",
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
      const data = await getCoursesReport(filters);
      setReportData(data);
    } catch (err: any) {
      setError("Error al generar el reporte. Intente nuevamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: "nombre", headerName: "Curso", flex: 1.5 },
    { field: "estado", headerName: "Estado", flex: 0.8 },
    {
      field: "alumnosActivos",
      headerName: "Alumnos Activos",
      type: "number",
      flex: 1,
    },
    {
      field: "avancePromedio",
      headerName: "% Avance",
      type: "number",
      flex: 1,
      valueFormatter: (params) => `${params.value}%`,
    },
    {
      field: "alumnosConDificultad",
      headerName: "% Dificultad",
      type: "number",
      flex: 1,
      valueGetter: (params) => params.value.porcentaje,
      valueFormatter: (params) => `${params.value}%`,
    },
    { field: "dificultadFrecuente", headerName: "Dif. Frecuente", flex: 1.2 },
    {
      field: "consultas",
      headerName: "% Consultas Res.",
      type: "number",
      flex: 1,
      valueGetter: (params) => params.value.pctResueltas,
      valueFormatter: (params) => `${params.value}%`,
    },
  ];

  return (
    <Box>
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
            <Grid sx={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                label="Estado Curso"
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
            <Grid sx={{ xs: 12, md: 3 }}>
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
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid sx={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Cursos
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
                  <Typography variant="h4" color="text.secondary">
                    {reportData.resumen.inactivos}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

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
