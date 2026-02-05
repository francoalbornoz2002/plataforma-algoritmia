import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Button,
  Autocomplete,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format, parse } from "date-fns";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { LineChart } from "@mui/x-charts/LineChart";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import InfoIcon from "@mui/icons-material/Info";

import {
  getCourseSessionsHistory,
  type CourseSessionsHistoryFilters,
} from "../../service/reports.service";
import { temas, estado_sesion } from "../../../../types";
import SesionDetailModal from "./SesionDetailModal";
import QuickDateFilter from "../../../../components/QuickDateFilter";

interface Props {
  courseId: string;
}

export default function CourseSessionsHistory({ courseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filters, setFilters] = useState<CourseSessionsHistoryFilters>({
    fechaDesde: "",
    fechaHasta: "",
    origen: "",
    docenteId: "",
    alumnoId: "",
    tema: "",
    dificultadId: "",
    estado: "",
  });

  // Modal
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lógica de filtrado de dificultades (Reutilizada de PreguntasPage)
  const allDifficulties = data?.filters?.dificultades || [];
  const filteredDifficulties = filters.tema
    ? allDifficulties.filter((d: any) => d.tema === filters.tema)
    : allDifficulties;

  // Carga de datos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getCourseSessionsHistory(courseId, filters);
        if (result.chartData) {
          result.chartData = result.chartData.map((d: any) => ({
            ...d,
            fecha: parse(d.fecha, "yyyy-MM-dd", new Date()),
          }));
        }
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el historial de sesiones.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId, filters]);

  // Handlers de Filtros Rápidos
  const handleQuickFilter = (start: string, end: string) => {
    setFilters({
      ...filters,
      fechaDesde: start,
      fechaHasta: end,
    });
  };

  const handleClearFilters = () => {
    setFilters({
      fechaDesde: "",
      fechaHasta: "",
      origen: "",
      docenteId: "",
      alumnoId: "",
      tema: "",
      dificultadId: "",
      estado: "",
    });
  };

  // Lógica para etiqueta dinámica de fecha
  const getDateLabel = () => {
    switch (filters.estado) {
      case estado_sesion.Pendiente:
        return "Fecha de Asignación";
      case estado_sesion.Completada:
        return "Fecha de Completado";
      case estado_sesion.No_realizada:
      case estado_sesion.Incompleta:
        return "Fecha Límite";
      default:
        return "Fecha de Ref.";
    }
  };

  // Columnas DataGrid
  const columns: GridColDef[] = [
    { field: "nroSesion", headerName: "#", width: 60 },
    {
      field: "fechaGrafico",
      headerName: getDateLabel(),
      width: 190,
      valueFormatter: (val) =>
        val ? format(new Date(val), "dd/MM/yyyy") : "-",
    },
    {
      field: "alumno",
      headerName: "Alumno",
      width: 200,
      valueGetter: (_: any, row: any) =>
        `${row.alumno.nombre} ${row.alumno.apellido}`,
    },
    {
      field: "origen",
      headerName: "Origen",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === "Sistema" ? "secondary" : "warning"}
          variant="outlined"
        />
      ),
    },
    {
      field: "tema",
      headerName: "Tema",
      width: 150,
      valueGetter: (_: any, row: any) => row.dificultad.tema,
    },
    {
      field: "dificultad",
      headerName: "Dificultad",
      width: 200,
      valueGetter: (_: any, row: any) => row.dificultad.nombre,
    },
    {
      field: "estado",
      headerName: "Estado",
      width: 130,
      renderCell: (params) => {
        const colors: any = {
          Completada: "success",
          Pendiente: "info",
          No_realizada: "error",
          Incompleta: "warning",
          Cancelada: "default",
        };
        return (
          <Chip
            label={params.value.replace("_", " ")}
            color={colors[params.value] || "default"}
            size="small"
          />
        );
      },
    },
    {
      field: "score",
      headerName: "Score",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) =>
        params.row.resultadoSesion ? (
          <Typography fontWeight="bold" color="success.main">
            {Number(params.row.resultadoSesion.pctAciertos).toFixed(0)}%
          </Typography>
        ) : (
          "-"
        ),
    },
    {
      field: "actions",
      headerName: "Ver",
      width: 70,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Ver detalle">
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              setSelectedSession(params.row);
              setIsModalOpen(true);
            }}
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const showLoading = loading && !data;

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="h5"
          gutterBottom
          color="primary.main"
          sx={{ mb: 2, fontWeight: "bold" }}
        >
          Historial de Sesiones Generadas
        </Typography>
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}
        >
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            disabled={!data}
            color="error"
          >
            Exportar PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<TableOnIcon />}
            disabled={!data}
            color="success"
          >
            Exportar Excel
          </Button>
        </Box>
      </Stack>

      {/* Alerta Informativa sobre Fechas */}
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2">
          La <b>fecha mostrada</b> en el gráfico y la tabla varía según el
          estado filtrado:
        </Typography>
        <ul
          style={{
            margin: "4px 0",
            paddingLeft: "20px",
            fontSize: "0.875rem",
          }}
        >
          <li>
            <b>Pendiente / Todos:</b> Fecha de asignación (creación).
          </li>
          <li>
            <b>Completada:</b> Fecha en que el alumno completó la sesión.
          </li>
          <li>
            <b>No realizada / Incompleta:</b> Fecha límite asignada.
          </li>
        </ul>
      </Alert>

      {/* --- Filtros --- */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <QuickDateFilter onApply={handleQuickFilter} />

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            flexWrap="wrap"
          >
            <DatePicker
              label="Desde"
              value={
                filters.fechaDesde
                  ? new Date(filters.fechaDesde + "T00:00:00")
                  : null
              }
              onChange={(val) =>
                setFilters({
                  ...filters,
                  fechaDesde: val ? format(val, "yyyy-MM-dd") : "",
                })
              }
              slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
            />
            <DatePicker
              label="Hasta"
              value={
                filters.fechaHasta
                  ? new Date(filters.fechaHasta + "T00:00:00")
                  : null
              }
              onChange={(val) =>
                setFilters({
                  ...filters,
                  fechaHasta: val ? format(val, "yyyy-MM-dd") : "",
                })
              }
              slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
            />

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Origen</InputLabel>
              <Select
                value={filters.origen}
                label="Origen"
                onChange={(e) =>
                  setFilters({ ...filters, origen: e.target.value as any })
                }
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="SISTEMA">Sistema</MenuItem>
                <MenuItem value="DOCENTE">Docente</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.estado}
                label="Estado"
                onChange={(e) =>
                  setFilters({ ...filters, estado: e.target.value })
                }
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value={estado_sesion.Pendiente}>Pendiente</MenuItem>
                <MenuItem value={estado_sesion.Completada}>Completada</MenuItem>
                <MenuItem value={estado_sesion.No_realizada}>
                  No Realizada
                </MenuItem>
                <MenuItem value={estado_sesion.Incompleta}>Incompleta</MenuItem>
              </Select>
            </FormControl>

            <Button variant="text" onClick={handleClearFilters}>
              Limpiar
            </Button>
          </Stack>

          {/* Filtros Avanzados (Fila 2) */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            flexWrap="wrap"
          >
            <Autocomplete
              options={data?.filters?.alumnos || []}
              getOptionLabel={(o: any) => `${o.nombre} ${o.apellido}`}
              value={
                data?.filters?.alumnos.find(
                  (a: any) => a.id === filters.alumnoId,
                ) || null
              }
              onChange={(_, val) =>
                setFilters({ ...filters, alumnoId: val?.id || "" })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Alumno"
                  size="small"
                  sx={{ width: 250 }}
                />
              )}
            />

            {filters.origen !== "SISTEMA" && (
              <Autocomplete
                options={data?.filters?.docentes || []}
                getOptionLabel={(o: any) => `${o.nombre} ${o.apellido}`}
                value={
                  data?.filters?.docentes.find(
                    (d: any) => d.id === filters.docenteId,
                  ) || null
                }
                onChange={(_, val) =>
                  setFilters({ ...filters, docenteId: val?.id || "" })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Docente Asignador"
                    size="small"
                    sx={{ width: 250 }}
                  />
                )}
              />
            )}

            <FormControl size="small" sx={{ width: 200 }}>
              <InputLabel>Tema</InputLabel>
              <Select
                value={filters.tema}
                label="Tema"
                onChange={(e) => {
                  setFilters({
                    ...filters,
                    tema: e.target.value,
                    dificultadId: "", // Resetear dificultad al cambiar tema
                  });
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {Object.values(temas).map((t) => (
                  <MenuItem key={t} value={t}>
                    <Typography variant="inherit" noWrap>
                      {t}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 250 }}>
              <InputLabel>Dificultad</InputLabel>
              <Select
                value={filters.dificultadId}
                label="Dificultad"
                onChange={(e) =>
                  setFilters({ ...filters, dificultadId: e.target.value })
                }
                disabled={allDifficulties.length === 0}
              >
                <MenuItem value="">Todas</MenuItem>
                {filteredDifficulties.map((d: any) => (
                  <MenuItem key={d.id} value={d.id}>
                    <Typography variant="inherit" noWrap title={d.nombre}>
                      {d.nombre}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Paper>

      {showLoading && (
        <CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {data && !showLoading && (
        <Stack spacing={4}>
          {/* Gráfico de Línea de Tiempo */}
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Actividad en el Tiempo
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cantidad de sesiones según fecha de referencia (Asignación,
              Completado o Vencimiento).
            </Typography>
            {data.chartData.length > 0 ? (
              <LineChart
                dataset={data.chartData}
                yAxis={[{ label: "Cantidad de sesiones" }]}
                xAxis={[
                  {
                    label: getDateLabel(),
                    scaleType: "point",
                    dataKey: "fecha",
                    valueFormatter: (val) => format(val, "dd/MM"),
                  },
                ]}
                series={[
                  {
                    dataKey: "cantidad",
                    label: "Sesiones",
                    color: "#2196f3",
                  },
                ]}
                height={300}
              />
            ) : (
              <Typography align="center" sx={{ py: 4 }} color="text.secondary">
                No hay datos para mostrar en el gráfico.
              </Typography>
            )}
          </Paper>

          {/* Tabla de Datos */}
          <Paper elevation={3} sx={{ height: 600, width: "100%" }}>
            <DataGrid
              rows={data.sessions}
              columns={columns}
              density="compact"
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
                sorting: {
                  sortModel: [{ field: "fechaGrafico", sort: "desc" }],
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
            />
          </Paper>
        </Stack>
      )}

      <SesionDetailModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sesion={selectedSession}
      />
    </Paper>
  );
}
