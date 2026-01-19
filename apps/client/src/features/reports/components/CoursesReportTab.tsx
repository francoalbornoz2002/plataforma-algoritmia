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
  Divider,
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
      const data = await getCoursesReport(filters);
      setReportData(data);
    } catch (err: any) {
      setError("Error al generar el reporte. Intente nuevamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
            <InputLabel>Estado Curso</InputLabel>
            <Select
              label="Estado Curso"
              name="estado"
              value={filters.estado}
              onChange={handleChange}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value={estado_simple.Activo}>Activo</MenuItem>
              <MenuItem value={estado_simple.Inactivo}>Inactivo</MenuItem>
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

      {/* Mensajes de Estado */}
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

      {/* Resultados */}
      {reportData && (
        <Box>
          {/* KPIs Globales */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Resumen Global
          </Typography>
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

          {/* Lista de Cursos (Tarjetas) */}
          <Typography variant="h6" gutterBottom>
            Detalle por Curso
          </Typography>
          <Grid container spacing={3}>
            {reportData.data.map((curso: any) => (
              <Grid key={curso.id} sx={{ xs: 12 }}>
                <Card variant="outlined">
                  <CardContent>
                    {/* Encabezado de la Tarjeta */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" component="div">
                        {curso.nombre}
                      </Typography>
                      <Chip
                        label={curso.estado}
                        color={
                          curso.estado === "Activo" ? "success" : "default"
                        }
                        variant="filled"
                        size="small"
                      />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    {/* Métricas del Curso */}
                    <Grid container spacing={2}>
                      {/* Fila 1: Personas y Progreso */}
                      <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Alumnos Activos
                        </Typography>
                        <Typography variant="h6">
                          {curso.alumnosActivos}
                        </Typography>
                      </Grid>
                      <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Docentes Activos
                        </Typography>
                        <Typography variant="h6">
                          {curso.docentesActivos}
                        </Typography>
                      </Grid>
                      <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          % Avance Promedio
                        </Typography>
                        <Typography variant="h6">
                          {curso.avancePromedio}%
                        </Typography>
                      </Grid>
                      <Grid sx={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Alumnos con Dificultad
                        </Typography>
                        <Typography variant="h6">
                          {curso.alumnosConDificultad.cantidad}
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            ({curso.alumnosConDificultad.porcentaje}%)
                          </Typography>
                        </Typography>
                      </Grid>

                      {/* Fila 2: Detalles de Dificultad */}
                      <Grid sx={{ xs: 12, sm: 6, md: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Dificultad más frecuente
                        </Typography>
                        <Typography variant="body1">
                          {curso.dificultadFrecuente}
                        </Typography>
                      </Grid>
                      <Grid sx={{ xs: 12, sm: 6, md: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Tema más frecuente
                        </Typography>
                        <Typography variant="body1">
                          {curso.temaFrecuente}
                        </Typography>
                      </Grid>

                      {/* Fila 3: Interacciones (Consultas, Clases, Sesiones) */}
                      <Grid sx={{ xs: 12, sm: 4 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Consultas
                        </Typography>
                        <Typography variant="body1">
                          Total: <strong>{curso.consultas.total}</strong>
                        </Typography>
                        <Typography variant="caption" color="success.main">
                          {curso.consultas.pctResueltas}% Resueltas
                        </Typography>
                      </Grid>
                      <Grid sx={{ xs: 12, sm: 4 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Clases de Consulta
                        </Typography>
                        <Typography variant="body1">
                          Total: <strong>{curso.clases.total}</strong>
                        </Typography>
                        <Typography variant="caption" color="primary.main">
                          {curso.clases.pctRealizadas}% Realizadas
                        </Typography>
                      </Grid>
                      <Grid sx={{ xs: 12, sm: 4 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Sesiones de Refuerzo
                        </Typography>
                        <Typography variant="body1">
                          Total: <strong>{curso.sesiones.total}</strong>
                        </Typography>
                        <Typography variant="caption" color="secondary.main">
                          {curso.sesiones.pctCompletadas}% Completadas
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
