import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  type SelectChangeEvent,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridSortModel,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { FindLogsParams, LogAuditoria } from "../../../types";
import { useDebounce } from "../../../hooks/useDebounce";
import { findLogs } from "../services/audit.service";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import InfoIcon from "@mui/icons-material/Info";
import HistoryIcon from "@mui/icons-material/History";
import UserDetailModal from "../components/UserDetailModal";
import { datePickerConfig } from "../../../config/theme.config";
import HeaderReportPage from "../../../components/HeaderReportPage";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";

// 1. Hooks y Servicios

// 2. Tipos

const DB_TABLES = [
  "alumno_curso",
  "clases_consulta",
  "consultas",
  "consultas_clase",
  "cursos",
  "dias_clase",
  "dificultad_alumno",
  "dificultades",
  "dificultades_curso",
  "docente_curso",
  "historial_dificultades_alumno",
  "historial_dificultades_curso",
  "historial_progreso_alumno",
  "historial_progreso_curso",
  "institucion",
  "localidades",
  "mision_especial_completada",
  "misiones",
  "misiones_completadas",
  "motivos_clase_no_realizada",
  "opciones_respuesta",
  "preguntas",
  "preguntas_sesion",
  "progreso_alumno",
  "progreso_curso",
  "provincias",
  "reportes_generados",
  "respuestas_alumno",
  "respuestas_consulta",
  "resultados_sesion",
  "sesiones_refuerzo",
  "usuarios",
  "valoraciones",
];

// --- Componente Helper para el Modal de JSON ---
interface AuditDetailModalProps {
  open: boolean;
  onClose: () => void;
  log: LogAuditoria | null; // Recibe el log completo
}

function AuditDetailModal({ open, onClose, log }: AuditDetailModalProps) {
  // --- 3. LÓGICA DE COMPARACIÓN ---
  const comparisonData = useMemo(() => {
    if (!log) return [];

    const oldData = log.valoresAnteriores || {};
    const newData = log.valoresNuevos || {};

    // Obtenemos todas las claves de ambos objetos, sin duplicados
    const allKeys = [
      ...new Set([...Object.keys(oldData), ...Object.keys(newData)]),
    ];

    return allKeys.map((key) => {
      const oldValue = oldData[key];
      const newValue = newData[key];

      // Convertimos a string para una comparación simple
      // (Ignoramos 'object' que siempre será diferente)
      const oldValueStr =
        typeof oldValue === "object" || oldValue === undefined
          ? JSON.stringify(oldValue)
          : String(oldValue);
      const newValueStr =
        typeof newValue === "object" || newValue === undefined
          ? JSON.stringify(newValue)
          : String(newValue);

      const isDifferent = oldValueStr !== newValueStr;

      return {
        field: key,
        oldValue: oldValueStr || "---",
        newValue: newValueStr || "---",
        isDifferent: isDifferent,
      };
    });
  }, [log]);

  if (!log) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalle de Cambio (Tabla: {log.tablaAfectada})</DialogTitle>
      <DialogContent>
        {/* Usamos una Tabla de MUI para el side-by-side */}
        <TableContainer component={Paper} variant="outlined">
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Campo</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  Datos Anteriores
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  Datos Actuales
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comparisonData.map((row) => (
                <TableRow
                  key={row.field}
                  // --- 4. ¡RESALTAMOS LAS FILAS QUE CAMBIARON! ---
                  sx={{
                    ...(row.isDifferent && {
                      backgroundColor: "rgba(255, 236, 179, 0.2)", // Un amarillo suave
                      "& > *": { fontWeight: "bold" }, // Resaltamos el texto
                    }),
                  }}
                >
                  <TableCell component="th" scope="row">
                    {row.field}
                  </TableCell>
                  <TableCell>{row.oldValue}</TableCell>
                  <TableCell>{row.newValue}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
// --- Fin Componente Helper ---

// --- Componente Principal ---
export default function AuditPage() {
  // --- Estados de la DataGrid ---
  const [rows, setRows] = useState<LogAuditoria[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [gridLoading, setGridLoading] = useState(true);
  const [gridError, setGridError] = useState<string | null>(null);

  // --- Estado para el Modal ---
  const [logToView, setLogToView] = useState<LogAuditoria | null>(null);

  // --- Estado para el Modal de Usuario ---
  const [viewUserId, setViewUserId] = useState<string | null>(null);

  // --- Estado de Filtros ---
  const [paginationModel, setPaginationModel] = useState({
    page: 0, // MUI usa 0-indexed
    pageSize: 10,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "fechaHora", sort: "desc" },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Agrupamos los filtros que no son de la grilla
  const [filters, setFilters] = useState({
    fechaDesde: "",
    fechaHasta: "",
    tablaAfectada: "",
    operacion: "",
  });

  // --- Filtros combinados para el PDF (Incluye Ordenamiento y Búsqueda) ---
  const pdfFilters = useMemo(() => {
    const currentSort = sortModel[0];
    return {
      ...filters,
      sort: currentSort?.field,
      order: currentSort?.sort,
    };
  }, [filters, sortModel]);

  // --- Data Fetching (DataGrid) ---
  useEffect(() => {
    setGridLoading(true);
    setGridError(null);

    // 1. Construimos los parámetros
    const params: FindLogsParams = {
      page: paginationModel.page + 1, // API usa 1-indexed
      limit: paginationModel.pageSize,
      sort: sortModel[0]?.field || "fechaHora",
      order: sortModel[0]?.sort || "desc",
      search: debouncedSearchTerm,
      ...filters, // Añadimos los filtros de fecha, tabla, etc.
    };

    // 2. Llamamos al servicio
    findLogs(params)
      .then((response) => {
        setRows(response.data);
        setTotalRows(response.total);
      })
      .catch((err) => setGridError(err.message))
      .finally(() => setGridLoading(false));
  }, [
    // 3. Escuchamos todos los estados
    paginationModel,
    sortModel,
    debouncedSearchTerm,
    filters,
  ]);

  // --- Handlers ---
  // Handler para los Select de texto
  const handleFilterChange = (
    e: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  // Handler para las Fechas
  const handleDateChange = (
    fieldName: "fechaDesde" | "fechaHasta",
    newDate: Date | null,
  ) => {
    let dateString = "";
    if (newDate && isValid(newDate)) {
      dateString = format(newDate, "yyyy-MM-dd");
    }
    setFilters((prev) => ({
      ...prev,
      [fieldName]: dateString,
    }));
    // Reseteamos la página al cambiar un filtro
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({
      fechaDesde: "",
      fechaHasta: "",
      tablaAfectada: "",
      operacion: "",
    });
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  // --- Columnas (DataGrid) ---
  const columns = useMemo<GridColDef<LogAuditoria>[]>(
    () => [
      {
        field: "fechaHora",
        headerName: "Fecha y Hora",
        minWidth: 160,
        valueFormatter: (value: string | null) => {
          if (!value) return "";
          return format(new Date(value), "dd/MM/yyyy HH:mm:ss", { locale: es });
        },
      },
      {
        field: "usuarioModifico",
        headerName: "Usuario",
        minWidth: 300,
        renderCell: (params: GridRenderCellParams<LogAuditoria>) => {
          const email = params.row.usuarioModifico?.email;
          const id = params.row.idUsuarioModifico;

          if (!id)
            return (
              <Stack
                direction="row"
                spacing={1}
                justifyContent="space-between"
                alignItems="center"
                sx={{ width: "100%", height: "100%" }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ flex: 1 }}
                >
                  Sistema
                </Typography>
                <Tooltip title="Operación automática del sistema (tareas programadas, triggers, etc.)">
                  <InfoIcon
                    fontSize="small"
                    color="action"
                    sx={{ cursor: "help" }}
                  />
                </Tooltip>
              </Stack>
            );

          return (
            <Stack
              direction="row"
              spacing={1}
              justifyContent="space-between"
              alignItems="center"
              sx={{ width: "100%", height: "100%" }}
            >
              <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                {email}
              </Typography>
              <Tooltip title="Ver detalle del usuario">
                <IconButton size="small" onClick={() => setViewUserId(id)}>
                  <InfoIcon fontSize="small" color="primary" />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
      },
      {
        field: "tablaAfectada",
        headerName: "Tabla",
        minWidth: 200,
      },
      {
        field: "operacion",
        headerName: "Operación",
        headerAlign: "center",
        align: "center",
        minWidth: 100,
        renderCell: (params: GridRenderCellParams<LogAuditoria>) => {
          let op = params.row.operacion;
          let color: "default" | "success" | "info" | "error" = "default";

          // Detectar Soft Delete (UPDATE de deleted_at: null -> fecha)
          const isSoftDelete =
            op === "UPDATE" &&
            params.row.valoresAnteriores &&
            (params.row.valoresAnteriores as any).deleted_at === null &&
            params.row.valoresNuevos &&
            (params.row.valoresNuevos as any).deleted_at;

          if (op === "INSERT") {
            color = "success";
          } else if (op === "DELETE" || isSoftDelete) {
            color = "error";
            if (isSoftDelete) op = "DELETE";
          } else if (op === "UPDATE") {
            color = "info";
          }

          return (
            <Chip
              label={op}
              color={color}
              variant="outlined"
              size="small"
              sx={{ minWidth: 70 }}
            />
          );
        },
      },
      {
        field: "idFilaAfectada",
        headerName: "ID Fila",
        flex: 1.5,
        minWidth: 150,
      },
      {
        field: "actions",
        headerName: "Estado",
        flex: 1,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: (params: GridRenderCellParams<LogAuditoria>) => (
          <Button
            size="small"
            variant="outlined"
            disabled={
              !params.row.valoresAnteriores && !params.row.valoresNuevos
            }
            onClick={() => setLogToView(params.row)} // <-- Abre el modal con el log
          >
            Ver Cambios
          </Button>
        ),
      },
    ],
    [],
  );

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
          title="Reporte de Auditoría"
          description="Monitorea todos los cambios realizados en la base de datos por usuarios o procesos automáticos."
          icon={<HistoryIcon />}
          filters={pdfFilters}
          endpointPathPdf="/auditoria/pdf"
          endpointPathCsv="/auditoria/csv"
          filenameCsv="auditoria.csv"
          disabled={rows.length === 0}
        />

        {/* Filtros */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <DatePicker
            label="Fecha Desde"
            value={filters.fechaDesde ? parseISO(filters.fechaDesde) : null}
            onChange={(newDate) => handleDateChange("fechaDesde", newDate)}
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
            value={filters.fechaHasta ? parseISO(filters.fechaHasta) : null}
            onChange={(newDate) => handleDateChange("fechaHasta", newDate)}
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
            disableFuture={true}
          />
          <TextField
            label="Buscar (Tabla, ID, Usuario)..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250, flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Tabla Afectada</InputLabel>
            <Select
              name="tablaAfectada"
              value={filters.tablaAfectada}
              label="Tabla Afectada"
              onChange={handleFilterChange}
              MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
            >
              <MenuItem value="">Todas</MenuItem>
              {DB_TABLES.map((table) => (
                <MenuItem key={table} value={table}>
                  {table}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Operación</InputLabel>
            <Select
              name="operacion"
              value={filters.operacion}
              label="Operación"
              onChange={handleFilterChange}
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="INSERT">INSERT</MenuItem>
              <MenuItem value="UPDATE">UPDATE</MenuItem>
              <MenuItem value="DELETE">DELETE (Lógico)</MenuItem>
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

        {/* --- C. DataGrid --- */}
        {gridError && <Alert severity="error">{gridError}</Alert>}
        <Box sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            rowCount={totalRows}
            loading={gridLoading}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 30]}
            sortingMode="server"
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            sx={{
              // Desactivamos los 'outline' de foco
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
                outline: "none",
              },
              "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within":
                {
                  outline: "none",
                },
            }}
            disableColumnResize
          />
        </Box>

        {/* --- D. El Modal de Detalle (JSON) --- */}
        <AuditDetailModal
          open={!!logToView}
          onClose={() => setLogToView(null)}
          log={logToView}
        />

        {/* --- E. Modal de Detalle de Usuario --- */}
        <UserDetailModal
          open={!!viewUserId}
          onClose={() => setViewUserId(null)}
          userId={viewUserId}
        />
      </Stack>
    </Box>
  );
}
