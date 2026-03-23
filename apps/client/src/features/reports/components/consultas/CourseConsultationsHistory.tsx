import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Rating,
  Autocomplete,
  TextField,
  type SelectChangeEvent,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { LineChart } from "@mui/x-charts/LineChart";
import FunctionsIcon from "@mui/icons-material/Functions";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import {
  getCourseConsultationsHistory,
  type CourseConsultationsHistoryFilters,
} from "../../service/reports.service";
import { getStudentProgressList } from "../../../users/services/docentes.service";
import { temas, estado_consulta } from "../../../../types";
import { TemasLabels } from "../../../../types/traducciones";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import ReportStatCard from "../common/ReportStatCard";
import { datePickerConfig } from "../../../../config/theme.config";
import HeaderReportPage from "../../../../components/HeaderReportPage";
import { History } from "@mui/icons-material";

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

export default function CourseConsultationsHistory({ courseId }: Props) {
  // --- Estados ---
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filters, setFilters] = useState<CourseConsultationsHistoryFilters>({
    temas: "",
    estados: "",
    alumnos: "",
    fechaDesde: "",
    fechaHasta: "",
  });

  // Estados UI para filtros múltiples
  const [selectedTemas, setSelectedTemas] = useState<temas[]>([]);
  const [selectedEstados, setSelectedEstados] = useState<estado_consulta[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [studentOptions, setStudentOptions] = useState<
    { id: string; nombre: string }[]
  >([]);

  // Estado del Modal de Respuesta
  const [viewingResponse, setViewingResponse] = useState<any>(null);

  // --- Carga de Alumnos ---
  useEffect(() => {
    getStudentProgressList(courseId, {
      page: 1,
      limit: 1000,
      sort: "nombre",
      order: "asc",
    }).then((res) => {
      setStudentOptions(
        res.data.map((s) => ({
          id: s.idAlumno,
          nombre: `${s.nombre} ${s.apellido}`,
        })),
      );
    });
  }, [courseId]);

  // --- Sincronizar Filtros UI con Filtros API ---
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      temas: selectedTemas.join(","),
      estados: selectedEstados.join(","),
      alumnos: selectedStudents.join(","),
    }));
  }, [selectedTemas, selectedEstados, selectedStudents]);

  // --- Cargar Datos ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getCourseConsultationsHistory(courseId, filters);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el historial de consultas.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, filters]);

  // --- Handlers ---
  const handleQuickFilter = (start: string, end: string) => {
    setFilters((prev) => ({
      ...prev,
      fechaDesde: start,
      fechaHasta: end,
    }));
  };

  const handleTemasChange = (
    event: SelectChangeEvent<typeof selectedTemas>,
  ) => {
    const {
      target: { value },
    } = event;
    setSelectedTemas(
      typeof value === "string" ? (value.split(",") as temas[]) : value,
    );
  };

  const handleEstadosChange = (
    event: SelectChangeEvent<typeof selectedEstados>,
  ) => {
    const {
      target: { value },
    } = event;
    setSelectedEstados(
      typeof value === "string"
        ? (value.split(",") as estado_consulta[])
        : value,
    );
  };

  const handleClearFilters = () => {
    setFilters({
      temas: "",
      estados: "",
      alumnos: "",
      fechaDesde: "",
      fechaHasta: "",
    });
    setSelectedTemas([]);
    setSelectedEstados([]);
    setSelectedStudents([]);
  };

  // --- Columnas DataGrid ---
  const columns: GridColDef[] = [
    {
      field: "fecha",
      headerName: "Fecha de consulta",
      width: 165,
      valueFormatter: (value: string) => {
        if (!value) return "-";
        const date = new Date(value);
        return format(date, "dd/MM/yyyy");
      },
    },
    { field: "titulo", headerName: "Título", flex: 1, minWidth: 150 },
    { field: "tema", headerName: "Tema", width: 130 },
    { field: "alumno", headerName: "Alumno", flex: 1, width: 180 },
    {
      field: "estado",
      headerName: "Estado",
      width: 120,
      renderCell: (params) => {
        const colors: Record<
          string,
          "default" | "primary" | "success" | "warning"
        > = {
          Pendiente: "warning",
          A_revisar: "primary",
          Revisada: "default",
          Resuelta: "success",
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
    { field: "docente", headerName: "Atendido por", flex: 1, width: 180 },
    {
      field: "valoracion",
      headerName: "Valoración",
      width: 100,
      valueFormatter: (v) => (v ? `${v} ⭐` : "-"),
    },
    {
      field: "respuestaAction",
      headerName: "Respuesta",
      width: 90,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const isAtendida =
          params.row.estado === estado_consulta.Revisada ||
          params.row.estado === estado_consulta.Resuelta;
        return (
          <Tooltip title={isAtendida ? "Ver respuesta" : "Aún no atendida"}>
            <span>
              <IconButton
                size="small"
                disabled={!isAtendida}
                color="primary"
                onClick={() => setViewingResponse(params.row)}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        );
      },
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
          title="Historial de Consultas"
          description="Revisa el detalle y la evolución de todas las consultas realizadas en el curso."
          icon={<History />}
          filters={filters}
          endpointPathPdf={`/reportes/cursos/${courseId}/consultas/historial/pdf`}
          endpointPathExcel={`/reportes/cursos/${courseId}/consultas/historial/excel`}
          filenameExcel="historial_consultas.xlsx"
          disabled={!data}
        />

        {/* --- Filtros --- */}
        <Stack spacing={2}>
          <QuickDateFilter onApply={handleQuickFilter} />
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="center"
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
                      width: 170,
                    },
                  },
                  sx: { width: 170 },
                },
              }}
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
                      width: 170,
                    },
                  },
                  sx: { width: 170 },
                },
              }}
            />
            <FormControl size="small" sx={{ width: 270 }}>
              <InputLabel>Filtrar por Temas</InputLabel>
              <Select
                multiple
                value={selectedTemas}
                onChange={handleTemasChange}
                input={<OutlinedInput label="Filtrar por Temas" />}
                renderValue={(selected) =>
                  selected.map((t) => TemasLabels[t as temas] || t).join(", ")
                }
                MenuProps={MenuProps}
              >
                {Object.values(temas)
                  .filter((t) => t !== "Ninguno")
                  .map((t) => (
                    <MenuItem key={t} value={t}>
                      <Checkbox checked={selectedTemas.indexOf(t) > -1} />
                      <ListItemText primary={TemasLabels[t as temas] || t} />
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ width: 270 }}>
              <InputLabel>Filtrar por Estados</InputLabel>
              <Select
                multiple
                value={selectedEstados}
                onChange={handleEstadosChange}
                input={<OutlinedInput label="Filtrar por Estados" />}
                renderValue={(selected) => selected.join(", ")}
                MenuProps={MenuProps}
              >
                {Object.values(estado_consulta).map((e) => (
                  <MenuItem key={e} value={e}>
                    <Checkbox checked={selectedEstados.indexOf(e) > -1} />
                    <ListItemText primary={e.replace("_", " ")} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Autocomplete
              multiple
              disableCloseOnSelect
              size="small"
              options={studentOptions}
              getOptionLabel={(option) => option.nombre}
              value={studentOptions.filter((s) =>
                selectedStudents.includes(s.id),
              )}
              onChange={(_, newValue) => {
                setSelectedStudents(newValue.map((v) => v.id));
              }}
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props as any;
                return (
                  <li key={key} {...optionProps}>
                    <Checkbox checked={selected} sx={{ mr: 1, p: 0.5 }} />
                    {option.nombre}
                  </li>
                );
              }}
              renderTags={(tagValue) => {
                if (tagValue.length === 0) return null;
                return (
                  <Typography
                    variant="body2"
                    sx={{
                      ml: 1,
                      maxWidth: 140,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tagValue.map((v) => v.nombre).join(", ")}
                  </Typography>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filtrar por Alumno"
                  placeholder={selectedStudents.length === 0 ? "Buscar..." : ""}
                />
              )}
              sx={{ width: 270 }}
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
            {/* --- Stats Cards --- */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <ReportStatCard
                  icon={<FunctionsIcon fontSize="small" />}
                  title="Total de Consultas"
                  subtitle="Consultas realizadas en el periodo indicado"
                  count={data.stats.total}
                  color="primary"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <ReportStatCard
                  icon={<CalendarTodayIcon fontSize="small" />}
                  title="Promedio Diario"
                  subtitle="Consultas realizadas por día en el periodo indicado"
                  count={Number(data.stats.promedioDiario.toFixed(1))}
                  color="info"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <ReportStatCard
                  icon={<CheckCircleIcon fontSize="small" />}
                  title="Prom. Atendidas/Día"
                  subtitle="Consultas revisadas o resueltas por día"
                  count={Number(data.stats.promedioAtendidasDiario.toFixed(1))}
                  color="success"
                />
              </Grid>
            </Grid>
            {/* --- Timeline Chart --- */}
            <Paper
              elevation={3}
              sx={{ p: 2, width: "100%", boxSizing: "border-box" }}
            >
              <Typography variant="h6" gutterBottom>
                Evolución de Consultas en el Tiempo
              </Typography>
              {data.timeline.length > 0 ? (
                <LineChart
                  dataset={data.timeline}
                  yAxis={[
                    {
                      label: "Consultas realizadas",
                      min: 0,
                      valueFormatter: (value: number) =>
                        Number.isInteger(value) ? value.toString() : "",
                    },
                  ]}
                  xAxis={[
                    {
                      scaleType: "point",
                      dataKey: "fecha",
                      valueFormatter: (date) =>
                        format(new Date(date + "T00:00:00"), "dd/MM"),
                      label: "Fecha",
                    },
                  ]}
                  series={[
                    {
                      dataKey: "cantidad",
                      label: "Cantidad de Consultas",
                      color: "#1976d2",
                    },
                  ]}
                  height={300}
                />
              ) : (
                <Typography
                  align="center"
                  color="text.secondary"
                  sx={{ py: 4 }}
                >
                  No hay datos para mostrar en este periodo.
                </Typography>
              )}
            </Paper>

            {/* --- Tabla Detallada --- */}
            <Paper
              elevation={3}
              sx={{ width: "100%", boxSizing: "border-box" }}
            >
              <DataGrid
                rows={data.tabla}
                columns={columns}
                density="compact"
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  sorting: {
                    sortModel: [{ field: "fecha", sort: "desc" }],
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
                      No se encontraron consultas con los filtros aplicados.
                    </Stack>
                  ),
                }}
                sx={{ borderRadius: "12px", border: 0 }}
              />
            </Paper>
          </Box>
        )}

        {/* Modal de Detalle de Respuesta */}
        <Dialog
          open={!!viewingResponse}
          onClose={() => setViewingResponse(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Detalle de Atención</DialogTitle>
          <DialogContent dividers>
            {viewingResponse && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Consulta del Alumno
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    lineHeight={1.2}
                  >
                    {viewingResponse.titulo}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {viewingResponse.descripcion}
                  </Typography>
                </Box>
                <Divider />

                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Docente que atendió
                  </Typography>
                  <Typography variant="body1">
                    {viewingResponse.docente}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Respuesta / Resolución
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontStyle: viewingResponse.respuesta
                        ? "normal"
                        : "italic",
                    }}
                  >
                    {viewingResponse.respuesta ||
                      "Esta consulta fue atendida verbalmente en una clase de consulta."}
                  </Typography>
                </Box>
                <Divider />
                {viewingResponse.valoracion && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Valoración del Alumno
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Rating
                        value={viewingResponse.valoracion}
                        readOnly
                        size="small"
                      />
                      {viewingResponse.comentarioValoracion && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontStyle: "italic", mt: 0.5 }}
                        >
                          "{viewingResponse.comentarioValoracion}"
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewingResponse(null)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
}
