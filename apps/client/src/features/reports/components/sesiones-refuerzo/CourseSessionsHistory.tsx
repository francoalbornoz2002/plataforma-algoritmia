import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Alert,
  CircularProgress,
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
import InfoIcon from "@mui/icons-material/Info";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HistoryIcon from "@mui/icons-material/History";

import {
  getCourseSessionsHistory,
  type CourseSessionsHistoryFilters,
} from "../../service/reports.service";
import { temas, estado_sesion } from "../../../../types";
import {
  TemasLabels,
  EstadoSesionLabels,
} from "../../../../types/traducciones";
import SesionDetailModal from "./SesionDetailModal";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import { datePickerConfig } from "../../../../config/theme.config";
import HeaderReportPage from "../../../../components/HeaderReportPage";
import EstadoSesionChip from "../../../sesiones-refuerzo/components/EstadoSesionChip";

interface Props {
  courseId: string;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

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

  // Columnas DataGrid
  const columns: GridColDef[] = [
    {
      field: "nroSesion",
      headerName: "#",
      align: "center",
      headerAlign: "center",
      width: 10,
    },
    {
      field: "fechaAsignacion",
      headerName: "Fecha Asignación",
      width: 130,
      valueFormatter: (val) =>
        val ? format(new Date(val), "dd/MM/yyyy") : "-",
    },
    {
      field: "fechaCompletado",
      headerName: "Fecha Completado",
      width: 130,
      valueFormatter: (val) =>
        val ? format(new Date(val), "dd/MM/yyyy") : "-",
    },
    {
      field: "alumno",
      headerName: "Alumno Asignado",
      width: 200,
      valueGetter: (_: any, row: any) =>
        `${row.alumno.nombre} ${row.alumno.apellido}`,
    },
    {
      field: "origen",
      headerName: "Origen",
      headerAlign: "center",
      align: "center",
      width: 90,
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
      width: 190,
      valueGetter: (_: any, row: any) => row.dificultad.tema,
      valueFormatter: (val: any) => TemasLabels[val as temas] || val,
    },
    {
      field: "dificultad",
      headerName: "Dificultad",
      width: 360,
      flex: 1,
      valueGetter: (_: any, row: any) => row.dificultad.nombre,
    },
    {
      field: "estado",
      headerName: "Estado",
      align: "center",
      headerAlign: "center",
      width: 110,
      renderCell: (params) => <EstadoSesionChip estado={params.value} />,
    },
    {
      field: "score",
      headerName: "Pct. Aciertos",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) =>
        params.row.resultadoSesion ? (
          <Typography variant="h6" fontWeight="bold" color="success.main">
            {Number(params.row.resultadoSesion.pctAciertos).toFixed(0)}%
          </Typography>
        ) : (
          "-"
        ),
    },
    {
      field: "actions",
      headerName: "Resultados",
      headerAlign: "center",
      align: "center",
      width: 90,
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
          title="Historial de Sesiones"
          description="Revisa el detalle de todas las sesiones de refuerzo asignadas, completadas o vencidas."
          icon={<HistoryIcon />}
          filters={filters}
          endpointPathPdf={`/reportes/cursos/${courseId}/sesiones-refuerzo/historial/pdf`}
          endpointPathExcel={`/reportes/cursos/${courseId}/sesiones-refuerzo/historial/excel`}
          filenameExcel="historial_sesiones.xlsx"
          disabled={!data}
        />

        {/* Alerta Informativa sobre Fechas */}
        <Alert severity="info" icon={<InfoIcon />}>
          <Typography variant="body2">
            <b>Análisis Temporal:</b> El gráfico muestra simultáneamente las
            fechas de asignación, completado y vencimiento de las sesiones. Si
            aplicas un filtro de <b>Estado</b>, el gráfico se simplificará para
            mostrar únicamente la fecha relevante a dicho estado.
          </Typography>
        </Alert>

        {/* --- Filtros --- */}
        <Stack spacing={2}>
          <QuickDateFilter onApply={handleQuickFilter} />

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            flexWrap="wrap"
          >
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
              onChange={(val) =>
                setFilters({
                  ...filters,
                  fechaDesde: val ? format(val, "yyyy-MM-dd") : "",
                })
              }
              {...datePickerConfig}
              slotProps={{
                textField: {
                  ...datePickerConfig.slotProps.textField,
                  InputProps: {
                    sx: {
                      ...datePickerConfig.slotProps.textField.InputProps.sx,
                      width: 160,
                    },
                  },
                  sx: { width: 160 },
                },
              }}
            />
            <DatePicker
              label="Hasta"
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
              onChange={(val) =>
                setFilters({
                  ...filters,
                  fechaHasta: val ? format(val, "yyyy-MM-dd") : "",
                })
              }
              {...datePickerConfig}
              slotProps={{
                textField: {
                  ...datePickerConfig.slotProps.textField,
                  InputProps: {
                    sx: {
                      ...datePickerConfig.slotProps.textField.InputProps.sx,
                      width: 160,
                    },
                  },
                  sx: { width: 160 },
                },
              }}
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
                {Object.values(estado_sesion).map((estado) => (
                  <MenuItem key={estado} value={estado}>
                    {EstadoSesionLabels[estado]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
                  label="Alumno Asignado"
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

            <FormControl size="small" sx={{ width: 250 }}>
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
                      {TemasLabels[t]}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 400 }}>
              <InputLabel>Dificultad</InputLabel>
              <Select
                value={filters.dificultadId}
                label="Dificultad"
                onChange={(e) =>
                  setFilters({ ...filters, dificultadId: e.target.value })
                }
                disabled={allDifficulties.length === 0}
                MenuProps={MenuProps}
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

        {showLoading && (
          <CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />
        )}
        {error && <Alert severity="error">{error}</Alert>}

        {data && !showLoading && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: 2,
              width: "100%",
            }}
          >
            {/* Gráfico de Línea de Tiempo */}
            <Paper
              elevation={3}
              sx={{ p: 2, width: "100%", boxSizing: "border-box" }}
            >
              <Typography variant="h6" gutterBottom>
                Actividad en el Tiempo
              </Typography>
              {data.chartData.length > 0 ? (
                <LineChart
                  dataset={data.chartData}
                  yAxis={[
                    {
                      label: "Cantidad de sesiones",
                      valueFormatter: (value: number) =>
                        Number.isInteger(value) ? value.toString() : "",
                    },
                  ]}
                  xAxis={[
                    {
                      label: "Fecha",
                      scaleType: "point",
                      dataKey: "fecha",
                      valueFormatter: (val) => format(val, "dd/MM"),
                    },
                  ]}
                  series={
                    !filters.estado
                      ? [
                          {
                            dataKey: "asignadas",
                            label: "Asignadas",
                            color: "#1976d2", // Azul
                          },
                          {
                            dataKey: "completadas",
                            label: "Completadas",
                            color: "#2e7d32", // Verde
                          },
                          {
                            dataKey: "vencidas",
                            label: "Canceladas / No realizadas",
                            color: "#d32f2f", // Rojo
                          },
                        ]
                      : [
                          {
                            dataKey: "cantidad",
                            label: "Sesiones",
                            color: "#2196f3",
                          },
                        ]
                  }
                  height={300}
                />
              ) : (
                <Typography
                  align="center"
                  sx={{ py: 4 }}
                  color="text.secondary"
                >
                  No hay datos para mostrar en el gráfico.
                </Typography>
              )}
            </Paper>

            {/* Tabla de Datos */}
            <Paper
              elevation={3}
              sx={{ height: 450, width: "100%", boxSizing: "border-box" }}
            >
              <DataGrid
                rows={data.sessions}
                columns={columns}
                density="compact"
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  sorting: {
                    sortModel: [{ field: "fechaAsignacion", sort: "desc" }],
                  },
                }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                slots={{
                  noRowsOverlay: () => (
                    <Stack
                      height="100%"
                      alignItems="center"
                      justifyContent="center"
                    >
                      No se encontraron sesiones con los filtros aplicados.
                    </Stack>
                  ),
                }}
                sx={{ border: 0 }}
              />
            </Paper>
          </Box>
        )}

        <SesionDetailModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          sesion={selectedSession}
        />
      </Stack>
    </Box>
  );
}
