import { useState, useMemo } from "react"; // <-- 1. Añadir
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  Box,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { ClaseConsulta, ConsultaSimple } from "../../../types";
import TemaChip from "../../../components/TemaChip";
import ConsultaDetailInfoModal from "./ConsultaDetailInfoModal";

// Helper de fecha
const formatFechaSimple = (fechaISO: string) => {
  if (!fechaISO) return "";
  const fechaString = fechaISO.split("T")[0];
  const [year, month, day] = fechaString.split("-");
  return `${day}/${month}/${year}`;
};

interface ClaseDetailModalProps {
  open: boolean;
  onClose: () => void;
  clase: ClaseConsulta;
}

export default function ClaseDetailModal({
  open,
  onClose,
  clase,
}: ClaseDetailModalProps) {
  // 3. Estado para el modal de detalle (un modal dentro de otro)
  const [viewingConsulta, setViewingConsulta] = useState<ConsultaSimple | null>(
    null
  );

  // 4. Mapeamos los datos para la DataGrid
  const consultas = useMemo(() => {
    return clase.consultasEnClase.map((c) => c.consulta);
  }, [clase]);

  // 5. Definimos las columnas (casi idénticas a SelectionModal)
  const columns: GridColDef<ConsultaSimple>[] = [
    {
      field: "titulo",
      headerName: "Título",
      flex: 1.5,
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
            <DescriptionIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      {/* 6. Modal Principal (con la DataGrid) */}
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Consultas a revisar en la clase {clase.nombre}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: 450, width: "100%", mt: 2 }}>
            <DataGrid
              rows={consultas}
              columns={columns}
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 25]}
              getRowId={(row) => row.id}
              // (¡SIN checkboxSelection!)
              // (¡SIN rowSelectionModel!)
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
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* 7. Renderizado del Modal de Detalle (el de texto) */}
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
