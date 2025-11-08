import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  Grid,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";
import type { FindLogsParams, LogAuditoria } from "../../../types";
import { useDebounce } from "../../../hooks/useDebounce";
import { findLogs } from "../services/audit.service";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// 1. Hooks y Servicios

// 2. Tipos

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

  // --- Estado de Filtros ---
  const [queryOptions, setQueryOptions] = useState<FindLogsParams>({
    page: 1,
    limit: 10,
    sort: "fechaHora", // Ordenar por fecha por defecto
    order: "desc",
    fechaDesde: "",
    fechaHasta: "",
    tablaAfectada: "",
    operacion: "",
    search: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // --- Data Fetching (DataGrid) ---
  useEffect(() => {
    setGridLoading(true);
    setGridError(null);
    findLogs(queryOptions)
      .then((response) => {
        setRows(response.data);
        setTotalRows(response.total);
      })
      .catch((err) => setGridError(err.message))
      .finally(() => setGridLoading(false));
  }, [queryOptions]);

  // Efecto para el buscador (debounce)
  useEffect(() => {
    setQueryOptions((prev) => ({
      ...prev,
      search: debouncedSearchTerm,
      page: 1,
    }));
  }, [debouncedSearchTerm]);

  // --- Handlers ---
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
      sort: model[0]?.field || "fechaHora",
      order: model[0]?.sort || "desc",
    }));
  };

  const handleFilterChange = (
    e: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement>
  ) => {
    setQueryOptions((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      page: 1,
    }));
  };

  const handleDateChange = (
    fieldName: "fechaDesde" | "fechaHasta",
    newDate: Date | null
  ) => {
    let dateString = "";
    // Verificamos que la fecha sea válida
    if (newDate && isValid(newDate)) {
      // Formateamos a 'yyyy-MM-dd' para enviarlo a la API
      dateString = format(newDate, "yyyy-MM-dd");
    }

    setQueryOptions((prev) => ({
      ...prev,
      [fieldName]: dateString, // Guardamos el string
      page: 1, // Reseteamos la página
    }));
  };

  // --- Columnas (DataGrid) ---
  const columns = useMemo<GridColDef<LogAuditoria>[]>(
    () => [
      {
        field: "fechaHora",
        headerName: "Fecha y Hora",
        flex: 1.5,
        minWidth: 160,
        valueFormatter: (value: string | null) => {
          if (!value) return "";
          return format(new Date(value), "dd/MM/yyyy HH:mm:ss", { locale: es });
        },
      },
      {
        field: "usuarioModifico",
        headerName: "Usuario",
        flex: 1.5,
        minWidth: 180,
        valueGetter: (value: any, row: LogAuditoria) =>
          row.usuarioModifico?.email || "Sistema (NULL)",
      },
      {
        field: "tablaAfectada",
        headerName: "Tabla",
        flex: 1,
        minWidth: 120,
      },
      {
        field: "operacion",
        headerName: "Operación",
        flex: 1,
        minWidth: 100,
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
    []
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Logs de Auditoría
      </Typography>

      {/* --- B. Filtros --- */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Filtros</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Fila 1 */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Buscar (Tabla o ID Fila)..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Tabla Afectada</InputLabel>
                <Select
                  name="tablaAfectada"
                  value={queryOptions.tablaAfectada}
                  label="Tabla Afectada"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {/* (Estos valores los hardcodeamos por ahora) */}
                  <MenuItem value="usuarios">Usuarios</MenuItem>
                  <MenuItem value="cursos">Cursos</MenuItem>
                  <MenuItem value="institucion">Institución</MenuItem>
                  <MenuItem value="alumno_curso">Inscripciones</MenuItem>
                  <MenuItem value="docente_curso">Asignaciones</MenuItem>
                  <MenuItem value="mision_completada">Misiones</MenuItem>
                  <MenuItem value="dificultad_alumno">Dificultades</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Operación</InputLabel>
                <Select
                  name="operacion"
                  value={queryOptions.operacion}
                  label="Operación"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="CREATE">Crear</MenuItem>
                  <MenuItem value="UPDATE">Actualizar</MenuItem>
                  <MenuItem value="DELETE">Borrar</MenuItem>
                  <MenuItem value="SOFT_DELETE">Baja Lógica</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* Fila 2 - Fechas */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <DatePicker
                label="Fecha Desde"
                // Convertimos el string del estado (ej: "2025-11-01") a Date
                value={
                  queryOptions.fechaDesde
                    ? new Date(queryOptions.fechaDesde)
                    : null
                }
                onChange={(newDate) => handleDateChange("fechaDesde", newDate)}
                // Usamos slotProps para pasar props al TextField interno
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <DatePicker
                label="Fecha Hasta"
                value={
                  queryOptions.fechaHasta
                    ? new Date(queryOptions.fechaHasta)
                    : null
                }
                onChange={(newDate) => handleDateChange("fechaHasta", newDate)}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* --- C. DataGrid --- */}
      {gridError && <Alert severity="error">{gridError}</Alert>}
      <Box sx={{ height: 600, width: "100%" }}>
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
          pageSizeOptions={[10, 20, 30]}
          sortingMode="server"
          sortModel={[{ field: queryOptions.sort, sort: queryOptions.order }]}
          onSortModelChange={handleSortChange}
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
        />
      </Box>

      {/* --- D. El Modal de Detalle (JSON) --- */}
      <AuditDetailModal
        open={!!logToView}
        onClose={() => setLogToView(null)}
        log={logToView}
      />
    </Box>
  );
}
