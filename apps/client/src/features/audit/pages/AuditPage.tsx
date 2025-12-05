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
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridSortModel,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
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
    e: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement>
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
    newDate: Date | null
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
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* --- B. Filtros --- */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
          Filtros de búsqueda
        </Typography>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{
            mb: 2,
            flexWrap: "wrap", // Permite que los filtros bajen si no hay espacio
            gap: 1, // Espacio vertical si 'wrap' ocurre
          }}
        >
          <TextField
            label="Buscar (Tabla o ID Fila)..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250, flexGrow: 1 }} // El buscador crece
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Tabla Afectada</InputLabel>
            <Select
              name="tablaAfectada"
              value={filters.tablaAfectada}
              label="Tabla Afectada"
              onChange={handleFilterChange}
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="usuarios">usuarios</MenuItem>
              <MenuItem value="cursos">cursos</MenuItem>
              <MenuItem value="institucion">institucion</MenuItem>
              <MenuItem value="alumno_curso">alumno_curso</MenuItem>
              <MenuItem value="docente_curso">docente_curso</MenuItem>
              <MenuItem value="misiones_completadas">
                misiones_completadas
              </MenuItem>
              <MenuItem value="dificultad_alumno">dificultad_alumno</MenuItem>
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
          <DatePicker
            label="Fecha Desde"
            value={filters.fechaDesde ? new Date(filters.fechaDesde) : null}
            onChange={(newDate) => handleDateChange("fechaDesde", newDate)}
            slotProps={{
              textField: {
                size: "small",
                sx: { width: 170 }, // Ancho fijo para la fecha
              },
            }}
          />
          <DatePicker
            label="Fecha Hasta"
            value={filters.fechaHasta ? new Date(filters.fechaHasta) : null}
            onChange={(newDate) => handleDateChange("fechaHasta", newDate)}
            slotProps={{
              textField: {
                size: "small",
                sx: { width: 170 }, // Ancho fijo para la fecha
              },
            }}
            disableFuture={true}
          />
        </Stack>
      </Paper>

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
    </Box>
  );
}
