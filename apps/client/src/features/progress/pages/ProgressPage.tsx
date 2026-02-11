import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Alert,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Tooltip,
  Button,
  Paper,
  CircularProgress,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
  type GridSortDirection,
} from "@mui/x-data-grid";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { LineChart } from "@mui/x-charts/LineChart";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// Iconos
import StarIcon from "@mui/icons-material/Star";
import BoltIcon from "@mui/icons-material/Bolt";
import ReplayIcon from "@mui/icons-material/Replay";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PersonIcon from "@mui/icons-material/Person";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import PieChartIcon from "@mui/icons-material/PieChart";

// 1. Hooks y Servicios
import { useCourseContext } from "../../../context/CourseContext";
import { useDebounce } from "../../../hooks/useDebounce";
import {
  getCourseProgressSummary,
  getStudentProgressListReport,
} from "../../reports/service/reports.service";

// 2. Componentes
import StudentProgressDetailModal from "../components/StudentProgressDetailModal";
import DashboardStatCard from "../../dashboards/components/DashboardStatCard";
import HeaderPage from "../../../components/HeaderPage";
import PdfExportButton from "../../reports/components/common/PdfExportButton";
import ExcelExportButton from "../../reports/components/common/ExcelExportButton";
import QuickDateFilter from "../../../components/QuickDateFilter";

// 3. Tipos
import type { ProgresoAlumnoDetallado } from "../../../types";
import {
  ActivityRange,
  ProgressRange,
  StarsRange,
} from "../../../types/progress-filters";

type StudentRow = ProgresoAlumnoDetallado;

export default function ProgressPage() {
  const { selectedCourse } = useCourseContext();

  // --- ESTADOS ---

  // Filtro Global: Fecha de Corte (Histórico)
  const [fechaCorte, setFechaCorte] = useState<Date | null>(null);

  // Datos del Resumen (KPIs, Gráficos, Tops)
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Estado UI Gráfico
  const [chartType, setChartType] = useState<"gauge" | "line">("gauge");

  // Datos de la Grilla (Alumnos)
  const [rows, setRows] = useState<ProgresoAlumnoDetallado[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [gridLoading, setGridLoading] = useState(true);
  const [gridError, setGridError] = useState<string | null>(null);

  // Filtros de la Grilla
  const [queryOptions, setQueryOptions] = useState({
    page: 1,
    limit: 10,
    sort: "nombre",
    order: "asc",
    search: "",
    progressRange: "",
    starsRange: "",
    attemptsRange: "",
    activityRange: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [viewingStudent, setViewingStudent] = useState<StudentRow | null>(null);

  // --- EFECTOS ---

  // 1. Cargar Resumen (KPIs, Tops, Gráficos)
  useEffect(() => {
    if (!selectedCourse) return;

    const loadSummary = async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const data = await getCourseProgressSummary(selectedCourse.id, {
          fechaCorte: fechaCorte ? format(fechaCorte, "yyyy-MM-dd") : undefined,
        });
        setSummaryData(data);
      } catch (err: any) {
        setSummaryError(err.message || "Error al cargar resumen.");
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSummary();
  }, [selectedCourse, fechaCorte]);

  // 2. Cargar Grilla de Alumnos
  useEffect(() => {
    if (!selectedCourse) return;

    const loadGrid = async () => {
      setGridLoading(true);
      setGridError(null);
      try {
        const params = {
          ...queryOptions,
          fechaCorte: fechaCorte ? format(fechaCorte, "yyyy-MM-dd") : undefined,
        };
        const response = await getStudentProgressListReport(
          selectedCourse.id,
          params,
        );
        setRows(response.data);
        setTotalRows(response.total);
      } catch (err: any) {
        setGridError(err.message || "Error al cargar lista de alumnos.");
      } finally {
        setGridLoading(false);
      }
    };

    loadGrid();
  }, [selectedCourse, queryOptions, fechaCorte]);

  // 3. Sincronizar buscador
  useEffect(() => {
    setQueryOptions((prev) => {
      if (prev.search === debouncedSearchTerm) return prev;
      return {
        ...prev,
        search: debouncedSearchTerm,
        page: 1,
      };
    });
  }, [debouncedSearchTerm]);

  // --- HANDLERS ---

  const handlePaginationChange = (model: GridPaginationModel) => {
    setQueryOptions((prev) => ({
      ...prev,
      page: model.page + 1,
      limit: model.pageSize,
    }));
  };

  const handleSortChange = (model: GridSortModel) => {
    setQueryOptions((prev) => ({
      ...prev,
      sort: model[0]?.field || "nombre",
      order: (model[0]?.sort as "asc" | "desc") || "asc",
    }));
  };

  const handleFilterChange = (e: SelectChangeEvent<string | number>) => {
    setQueryOptions((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      page: 1,
    }));
  };

  const handleQuickDateApply = (start: string, end: string) => {
    // QuickDateFilter devuelve un rango, pero para fecha de corte usamos el 'end'
    // que representa "hasta tal fecha".
    setFechaCorte(new Date(end));
  };

  const handleClearDateFilter = () => {
    setFechaCorte(null);
  };

  // --- COLUMNAS ---
  const columns = useMemo<GridColDef<ProgresoAlumnoDetallado>[]>(
    () => [
      {
        field: "nombre",
        headerName: "Alumno",
        flex: 1,
        valueGetter: (value: any, row: ProgresoAlumnoDetallado) =>
          `${row.nombre} ${row.apellido}`,
      },
      {
        field: "pctMisionesCompletadas",
        headerName: "Progreso (%)",
        width: 110,
        valueFormatter: (value: number) =>
          typeof value === "number" ? `${value.toFixed(1)}%` : "N/A",
      },
      {
        field: "promEstrellas",
        headerName: "Estrellas (Prom.)",
        width: 130,
        valueFormatter: (value: number) =>
          typeof value === "number" ? `⭐ ${value.toFixed(1)}` : "N/A",
      },
      {
        field: "promIntentos",
        headerName: "Intentos (Prom.)",
        width: 130,
        valueFormatter: (value: number) =>
          typeof value === "number" ? value.toFixed(1) : "N/A",
      },
      {
        field: "totalExp",
        headerName: "EXP Total",
        width: 100,
      },
      {
        field: "ultimaActividad",
        headerName: "Última Actividad",
        width: 150,
        valueFormatter: (value: string | null) => {
          if (!value) return "Nunca";
          return (
            "hace " +
            formatDistanceToNow(new Date(value), {
              locale: es,
              addSuffix: false,
            })
          );
        },
      },
      {
        field: "actions",
        headerName: "Detalle",
        sortable: false,
        width: 100,
        renderCell: (params) => (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setViewingStudent(params.row)}
          >
            Ver
          </Button>
        ),
      },
    ],
    [],
  );

  if (!selectedCourse) {
    return (
      <Alert severity="info">
        Por favor, selecciona un curso para ver el progreso.
      </Alert>
    );
  }

  return (
    <Stack spacing={3} sx={{ width: "100%", pb: 4 }}>
      {/* --- 1. HEADER Y CONTROLES GLOBALES --- */}
      <Box>
        <HeaderPage
          title={`Progreso: ${selectedCourse.nombre}`}
          description="Monitoreo de rendimiento y avance del curso."
          icon={<AssessmentIcon />}
          color="primary"
        />
        <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            {/* Filtros de Fecha */}
            <Stack direction="row" spacing={2} alignItems="center">
              <DatePicker
                label="Fecha de Corte"
                value={fechaCorte}
                onChange={(val) => setFechaCorte(val)}
                slotProps={{ textField: { size: "small", sx: { width: 180 } } }}
                disableFuture
              />
              {fechaCorte && (
                <Tooltip title="Limpiar fecha (Ver actual)">
                  <Button
                    onClick={handleClearDateFilter}
                    color="inherit"
                    size="small"
                  >
                    Ver Actual
                  </Button>
                </Tooltip>
              )}
              <Divider orientation="vertical" flexItem />
              <QuickDateFilter onApply={handleQuickDateApply} />
            </Stack>

            {/* Botones de Exportación */}
            <Stack direction="row" spacing={1}>
              <PdfExportButton
                filters={{
                  fechaCorte: fechaCorte
                    ? format(fechaCorte, "yyyy-MM-dd")
                    : undefined,
                }}
                endpointPath={`/reportes/cursos/${selectedCourse.id}/progreso/resumen/pdf`}
                disabled={!summaryData}
              />
              <ExcelExportButton
                filters={{
                  fechaCorte: fechaCorte
                    ? format(fechaCorte, "yyyy-MM-dd")
                    : undefined,
                }}
                endpointPath={`/reportes/cursos/${selectedCourse.id}/progreso/resumen/excel`}
                disabled={!summaryData}
                filename="progreso_curso.xlsx"
              />
            </Stack>
          </Stack>
        </Paper>
      </Box>

      {/* --- 2. RESUMEN (KPIs) --- */}
      {summaryError && <Alert severity="error">{summaryError}</Alert>}
      {summaryLoading ? (
        <CircularProgress sx={{ mx: "auto" }} />
      ) : (
        summaryData && (
          <Stack spacing={3}>
            {/* KPIs Cards */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DashboardStatCard
                  title="Misiones"
                  value={summaryData.resumen.misionesCompletadas}
                  icon={<TaskAltIcon />}
                  color="success"
                  subtitle="Total completadas"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DashboardStatCard
                  title="Estrellas"
                  value={summaryData.resumen.estrellasTotales}
                  icon={<StarIcon />}
                  color="warning"
                  subtitle="Total acumuladas"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DashboardStatCard
                  title="Intentos"
                  value={summaryData.resumen.intentosTotales}
                  icon={<ReplayIcon />}
                  color="info"
                  subtitle="Total realizados"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <DashboardStatCard
                  title="Experiencia"
                  value={summaryData.resumen.expTotal}
                  icon={<BoltIcon />}
                  color="primary"
                  subtitle="Total XP"
                />
              </Grid>
            </Grid>

            {/* Gráficos y Tops */}
            <Grid container spacing={2}>
              {/* Panel Izquierdo: Gráfico */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Typography variant="h6">Análisis Visual</Typography>
                    <ToggleButtonGroup
                      value={chartType}
                      exclusive
                      onChange={(_, newVal) =>
                        newVal && setChartType(newVal as "gauge" | "line")
                      }
                      size="small"
                    >
                      <ToggleButton value="gauge">
                        <PieChartIcon sx={{ mr: 1 }} /> Global
                      </ToggleButton>
                      <ToggleButton value="line">
                        <ShowChartIcon sx={{ mr: 1 }} /> Evolución
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>

                  <Box
                    sx={{
                      height: 300,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {chartType === "gauge" ? (
                      <Gauge
                        value={summaryData.resumen.progresoTotal}
                        cornerRadius="50%"
                        sx={{
                          [`& .${gaugeClasses.valueText}`]: {
                            fontSize: 35,
                            fontWeight: "bold",
                          },
                          [`& .${gaugeClasses.valueArc}`]: { fill: "#4caf50" },
                        }}
                        text={({ value }) => `${value?.toFixed(1)}%`}
                        height={250}
                      />
                    ) : (
                      <LineChart
                        xAxis={[
                          {
                            dataKey: "fecha",
                            label: "Fecha",
                            scaleType: "point",
                            valueFormatter: (date) =>
                              format(new Date(date), "dd/MM"),
                          },
                        ]}
                        yAxis={[{ label: "Progreso (%)", min: 0, max: 100 }]}
                        series={[
                          {
                            dataKey: "progreso",
                            label: "Progreso (%)",
                            color: "#4caf50",
                            area: true,
                            showMark: true,
                          },
                        ]}
                        dataset={summaryData.evolucion.map((e: any) => ({
                          ...e,
                          fecha: new Date(e.fecha),
                        }))}
                        height={280}
                      />
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Panel Derecho: Estadísticas de Alumnos (Promedios + Tops) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                  <Typography variant="h6" gutterBottom>
                    Estadísticas de alumnos
                  </Typography>
                  <Stack spacing={3}>
                    {/* Promedios */}
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <DashboardStatCard
                          title="Prom. Estrellas"
                          value={summaryData.resumen.promEstrellas.toFixed(1)}
                          icon={<StarIcon />}
                          color="warning"
                          subtitle="Por alumno"
                          small
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <DashboardStatCard
                          title="Prom. Intentos"
                          value={summaryData.resumen.promIntentos.toFixed(1)}
                          icon={<ReplayIcon />}
                          color="info"
                          subtitle="Por alumno"
                          small
                        />
                      </Grid>
                    </Grid>
                    <Divider />
                    {/* Top Activos */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          mb={1}
                        >
                          <TrendingUpIcon color="success" fontSize="small" />
                          <Typography
                            variant="subtitle2"
                            color="success.main"
                            fontWeight="bold"
                          >
                            Más Activos
                          </Typography>
                        </Stack>
                        <List dense disablePadding>
                          {summaryData.tops?.activos.map(
                            (student: any, index: number) => (
                              <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                                <ListItemAvatar sx={{ minWidth: 36 }}>
                                  <Avatar
                                    sx={{
                                      bgcolor: "success.light",
                                      width: 24,
                                      height: 24,
                                    }}
                                  >
                                    <PersonIcon sx={{ fontSize: 16 }} />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={student.nombre}
                                  secondary={`${student.misiones} misiones (+${student.diferenciaPorcentual.toFixed(0)}%)`}
                                />
                              </ListItem>
                            ),
                          )}
                          {summaryData.tops?.activos.length === 0 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Sin datos
                            </Typography>
                          )}
                        </List>
                      </Box>
                      {/* Top Inactivos */}
                      <Box sx={{ flex: 1 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          mb={1}
                        >
                          <TrendingDownIcon color="error" fontSize="small" />
                          <Typography
                            variant="subtitle2"
                            color="error.main"
                            fontWeight="bold"
                          >
                            Menos Activos
                          </Typography>
                        </Stack>
                        <List dense disablePadding>
                          {summaryData.tops?.inactivos.map(
                            (student: any, index: number) => (
                              <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                                <ListItemAvatar sx={{ minWidth: 36 }}>
                                  <Avatar
                                    sx={{
                                      bgcolor: "error.light",
                                      width: 24,
                                      height: 24,
                                    }}
                                  >
                                    <PersonIcon sx={{ fontSize: 16 }} />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={student.nombre}
                                  secondary={`${student.misiones} misiones (${student.diferenciaPorcentual.toFixed(0)}%)`}
                                />
                              </ListItem>
                            ),
                          )}
                          {summaryData.tops?.inactivos.length === 0 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Sin datos
                            </Typography>
                          )}
                        </List>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        )
      )}

      {/* --- 3. GRILLA DE ALUMNOS --- */}
      <Stack spacing={2}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          👥 Detalle por Alumno
        </Typography>

        <Paper elevation={2} sx={{ p: 2 }}>
          {/* Filtros de Grilla */}
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ mb: 2 }}
          >
            <TextField
              label="Buscar Alumno..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Progreso</InputLabel>
              <Select
                name="progressRange"
                value={queryOptions.progressRange}
                label="Progreso"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todos</MenuItem>
                {Object.entries(ProgressRange).map(([key, value]) => (
                  <MenuItem key={key} value={value}>
                    {value}%
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Estrellas</InputLabel>
              <Select
                name="starsRange"
                value={queryOptions.starsRange}
                label="Estrellas"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todas</MenuItem>
                {Object.entries(StarsRange).map(([key, value]) => (
                  <MenuItem key={key} value={value}>
                    {value} ⭐
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Últ. Actividad</InputLabel>
              <Select
                name="activityRange"
                value={queryOptions.activityRange}
                label="Últ. Actividad"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value={ActivityRange.LAST_24H}>Últimas 24h</MenuItem>
                <MenuItem value={ActivityRange.LAST_3D}>
                  Últimos 3 días
                </MenuItem>
                <MenuItem value={ActivityRange.LAST_7D}>
                  Últimos 7 días
                </MenuItem>
                <MenuItem value={ActivityRange.INACTIVE}>
                  Inactivo (+7d)
                </MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Limpiar filtros de tabla">
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setQueryOptions((prev) => ({
                    ...prev,
                    progressRange: "",
                    starsRange: "",
                    attemptsRange: "",
                    activityRange: "",
                  }));
                }}
              >
                <FilterAltOffIcon />
              </Button>
            </Tooltip>
          </Stack>

          {/* DataGrid */}
          {gridError && <Alert severity="error">{gridError}</Alert>}
          <Box sx={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              rowCount={totalRows}
              loading={gridLoading}
              paginationMode="server"
              paginationModel={{
                page: queryOptions.page - 1,
                pageSize: queryOptions.limit,
              }}
              onPaginationModelChange={handlePaginationChange}
              pageSizeOptions={[10, 25, 50]}
              sortingMode="server"
              sortModel={[
                {
                  field: queryOptions.sort,
                  sort: queryOptions.order as GridSortDirection,
                },
              ]}
              onSortModelChange={handleSortChange}
              disableRowSelectionOnClick
              disableColumnResize
            />
          </Box>
        </Paper>
      </Stack>

      {/* Modal de Detalle */}
      {viewingStudent && (
        <StudentProgressDetailModal
          open={!!viewingStudent}
          onClose={() => setViewingStudent(null)}
          studentData={viewingStudent}
        />
      )}
    </Stack>
  );
}
