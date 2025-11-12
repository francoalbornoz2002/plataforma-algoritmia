import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRowSelectionModel,
} from "@mui/x-data-grid";
import type { ConsultaSimple } from "../../../types";
import TemaChip from "../../../components/TemaChip";
import { Description } from "@mui/icons-material";
import ConsultaDetailInfoModal from "./ConsultaDetailInfoModal";

// Helper de fecha
const formatFechaSimple = (fechaISO: string) => {
  if (!fechaISO) return "";
  const fechaString = fechaISO.split("T")[0];
  const [year, month, day] = fechaString.split("-");
  return `${day}/${month}/${year}`;
};

interface ConsultaSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  consultasList: ConsultaSimple[];
  initialSelection: string[];
}

export default function ConsultaSelectionModal({
  open,
  onClose,
  onConfirm,
  consultasList,
  initialSelection,
}: ConsultaSelectionModalProps) {
  // --- 1. ESTADO (Vuelve a ser simple) ---
  // El 'rowSelectionModel' (con la prop de abajo) SÍ es un array de IDs.
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: "include",
    ids: new Set(initialSelection), // <-- Usamos un Set
  });

  const [viewingConsulta, setViewingConsulta] = useState<ConsultaSimple | null>(
    null
  );

  useEffect(() => {
    if (open) {
      setSelectionModel({
        type: "include",
        ids: new Set(initialSelection),
      });
    }
  }, [open, initialSelection]);

  const handleConfirm = () => {
    // 1. Convertimos el Set<GridRowId> a (string | number)[]
    const idsArray = Array.from(selectionModel.ids);

    // 2. Forzamos la conversión de (string | number)[] a string[]
    const stringIdsArray = idsArray.map((id) => String(id));

    // 3. Pasamos el array de strings puros
    onConfirm(stringIdsArray);
  };

  // Columnas para el modal de selección
  const columns: GridColDef<ConsultaSimple>[] = [
    {
      field: "titulo",
      headerName: "Título",
      flex: 1,
    },
    {
      field: "alumno",
      headerName: "Alumno",
      flex: 1,
      valueGetter: (value, row: ConsultaSimple) =>
        `${row.alumno.nombre} ${row.alumno.apellido}`,
    },
    {
      field: "tema",
      headerName: "Tema",
      flex: 0.5,
      renderCell: (params) => <TemaChip tema={params.value} />,
    },
    {
      field: "fechaConsulta",
      headerName: "Fecha",
      flex: 0.5,
      valueFormatter: (value: string) => formatFechaSimple(value),
    },
    {
      field: "actions",
      headerName: "Acciones",
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Ver descripción completa">
          <IconButton onClick={() => setViewingConsulta(params.row)}>
            <Description />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Seleccionar Consultas Pendientes</DialogTitle>
        <DialogContent>
          <Box sx={{ height: 450, width: "100%", mt: 2 }}>
            <DataGrid
              rows={consultasList}
              columns={columns}
              getRowId={(row) => row.id}
              pageSizeOptions={[5, 10, 25]}
              checkboxSelection
              disableRowSelectionExcludeModel
              onRowSelectionModelChange={(newSelection) => {
                setSelectionModel(newSelection);
              }}
              rowSelectionModel={selectionModel}
              sx={{
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
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} variant="contained">
            Aceptar ({selectionModel.ids.size} seleccionadas)
          </Button>
        </DialogActions>
      </Dialog>
      {/* --- 6. Renderizado del Modal de Detalle --- */}
      {viewingConsulta && (
        <ConsultaDetailInfoModal
          open={!!viewingConsulta}
          onClose={() => setViewingConsulta(null)}
          consulta={viewingConsulta}
        />
      )}
    </>
  );
}
