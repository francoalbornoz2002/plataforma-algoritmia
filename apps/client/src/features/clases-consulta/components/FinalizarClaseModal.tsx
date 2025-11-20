import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRowSelectionModel,
} from "@mui/x-data-grid";
import { Description } from "@mui/icons-material";

// Componentes y Tipos
import type { ClaseConsulta, ConsultaSimple } from "../../../types"; // Asegúrate de importar ConsultaSimple
import TemaChip from "../../../components/TemaChip";
import ConsultaDetailInfoModal from "./ConsultaDetailInfoModal"; // Reutilizamos el mismo modal de detalle

// Helper de fecha (mismo que en tu ejemplo)
const formatFechaSimple = (fechaISO: string | Date) => {
  if (!fechaISO) return "";
  const fechaString = new Date(fechaISO).toISOString().split("T")[0];
  const [year, month, day] = fechaString.split("-");
  return `${day}/${month}/${year}`;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    realizada: boolean;
    motivo?: string;
    consultasRevisadasIds?: string[];
  }) => void;
  clase: ClaseConsulta | null;
  isLoading?: boolean;
}

export const FinalizarClaseModal = ({
  open,
  onClose,
  onConfirm,
  clase,
  isLoading,
}: Props) => {
  // Estado del formulario
  const [realizada, setRealizada] = useState<string>("si");
  const [motivo, setMotivo] = useState("");

  // Estado del DataGrid
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: "include",
    ids: new Set(),
  });

  // Estado para ver detalles
  const [viewingConsulta, setViewingConsulta] = useState<ConsultaSimple | null>(
    null
  );

  // 1. Preparamos los datos para el DataGrid
  // Aplanamos la estructura: Clase -> ConsultasEnClase -> Consulta
  const rows = useMemo(() => {
    return (
      clase?.consultasEnClase?.map((item: any) => item.consulta || item) || []
    );
  }, [clase]);

  // 2. Efecto de Inicialización
  useEffect(() => {
    if (open && clase) {
      setRealizada("si");
      setMotivo("");

      // Por defecto, marcamos TODAS las consultas como revisadas
      const allIds = rows.map((r: any) => r.id);
      setSelectionModel({
        type: "include",
        ids: new Set(allIds),
      });
    }
  }, [open, clase, rows]);

  // 3. Handler de confirmación
  const handleSubmit = () => {
    if (realizada === "no" && !motivo.trim()) return;

    // Convertimos la selección del DataGrid a array de strings
    const idsSelected = Array.from(selectionModel.ids).map(String);

    onConfirm({
      realizada: realizada === "si",
      motivo: realizada === "no" ? motivo : undefined,
      consultasRevisadasIds: realizada === "si" ? idsSelected : undefined,
    });
  };

  // 4. Definición de Columnas
  const columns: GridColDef[] = [
    {
      field: "titulo",
      headerName: "Título",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "alumno",
      headerName: "Alumno",
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) =>
        row.alumno ? `${row.alumno.nombre} ${row.alumno.apellido}` : "N/A",
    },
    {
      field: "tema",
      headerName: "Tema",
      width: 120,
      renderCell: (params) => <TemaChip tema={params.value} />,
    },
    {
      field: "fechaConsulta",
      headerName: "Fecha",
      width: 100,
      valueFormatter: (value: string) => formatFechaSimple(value),
    },
    {
      field: "actions",
      headerName: "Ver",
      width: 60,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip title="Ver detalle">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation(); // Evitar que el click seleccione/deseleccione la fila
              setViewingConsulta(params.row);
            }}
          >
            <Description fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (!clase) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={isLoading ? undefined : onClose}
        maxWidth="md" // Un poco más ancho para que entre la tabla
        fullWidth
      >
        <DialogTitle>Finalizar Clase de Consulta</DialogTitle>

        <DialogContent dividers>
          {/* SECCIÓN 1: ¿Se realizó? */}
          <FormControl component="fieldset" sx={{ mb: 2, width: "100%" }}>
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: "bold" }}>
              ¿Se llevó a cabo la clase?
            </FormLabel>
            <RadioGroup
              row
              value={realizada}
              onChange={(e) => setRealizada(e.target.value)}
            >
              <FormControlLabel
                value="si"
                control={<Radio />}
                label="Sí, se realizó"
              />
              <FormControlLabel
                value="no"
                control={<Radio color="error" />}
                label="No se realizó"
              />
            </RadioGroup>
          </FormControl>

          {/* SECCIÓN 2: Contenido Condicional */}
          {realizada === "si" ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Selecciona las consultas que <b>lograste revisar</b>. Las que
                desmarques volverán a estado "Pendiente".
              </Alert>

              <Box sx={{ height: 400, width: "100%" }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  getRowId={(row) => row.id}
                  checkboxSelection
                  disableRowSelectionExcludeModel
                  // Controlamos la selección con el estado
                  rowSelectionModel={selectionModel}
                  onRowSelectionModelChange={(newSelection) => {
                    setSelectionModel(newSelection);
                  }}
                  // Opciones visuales
                  pageSizeOptions={[5, 10]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 5 } },
                  }}
                  sx={{
                    "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within":
                      {
                        outline: "none",
                      },
                    "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within":
                      {
                        outline: "none",
                      },
                  }}
                />
              </Box>
            </Box>
          ) : (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Al cancelar, la clase quedará como "No Realizada" y todas las
                consultas volverán a "Pendiente" para ser reagendadas.
              </Alert>
              <TextField
                label="Motivo de cancelación"
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Explica brevemente el motivo (ej: Ausencia docente, problemas técnicos, etc.)"
                required
                error={realizada === "no" && !motivo.trim()}
                helperText={
                  realizada === "no" && !motivo.trim()
                    ? "El motivo es obligatorio"
                    : "Este motivo quedará registrado en el historial"
                }
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color={realizada === "si" ? "primary" : "error"}
            disabled={isLoading || (realizada === "no" && !motivo.trim())}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : realizada === "si" ? (
              `Confirmar (${selectionModel.ids.size} revisadas)`
            ) : (
              "Confirmar Cancelación"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Detalle (Reutilizado) */}
      {viewingConsulta && (
        <ConsultaDetailInfoModal
          open={!!viewingConsulta}
          onClose={() => setViewingConsulta(null)}
          consulta={viewingConsulta}
        />
      )}
    </>
  );
};

export default FinalizarClaseModal;
