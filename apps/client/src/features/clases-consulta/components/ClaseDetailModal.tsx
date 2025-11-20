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
  Chip,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
  estado_clase_consulta,
  type ClaseConsulta,
  type ConsultaSimple,
} from "../../../types";
import TemaChip from "../../../components/TemaChip";
import ConsultaDetailInfoModal from "./ConsultaDetailInfoModal";
import { Cancel, CheckCircle, HelpOutline } from "@mui/icons-material";

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

  // 1. Preparar Filas: Aplanamos el objeto para incluir 'revisadaEnClase' en la fila
  const rows = useMemo(() => {
    if (!clase?.consultasEnClase) return [];

    return clase.consultasEnClase.map((item: any) => ({
      ...item.consulta, // Copiamos propiedades de la consulta (titulo, alumno, etc.)
      // Agregamos la propiedad clave que viene de la tabla intermedia
      revisada: item.revisadaEnClase || false,
    }));
  }, [clase]);

  // Helper para saber si debemos mostrar la columna de estado
  // (Solo tiene sentido si la clase ya se realizó)
  const isRealizada = clase.estadoClase === estado_clase_consulta.Realizada;

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
    // --- NUEVA COLUMNA: ESTADO (Solo visible/relevante si la clase se realizó) ---
    {
      field: "revisada",
      headerName: "Revisión",
      width: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        // Si la clase NO está realizada, mostramos algo neutro o nada
        if (!isRealizada) {
          return (
            <Chip
              label="Pendiente"
              size="small"
              variant="outlined"
              icon={<HelpOutline />}
            />
          );
        }

        // Si SI está realizada, diferenciamos
        if (params.value === true) {
          return (
            <Chip
              label="Revisada"
              color="success"
              size="small"
              icon={<CheckCircle />}
              variant="filled"
            />
          );
        } else {
          return (
            <Chip
              label="No revisada"
              color="default" // o 'error' si quieres ser más drástico
              size="small"
              icon={<Cancel />}
              variant="outlined"
            />
          );
        }
      },
    },
    // -----------------------------------------------------------------------------
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
              rows={rows}
              columns={columns}
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 25]}
              getRowId={(row) => row.id}
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

      {/* Modal de Detalle de la consulta individual */}
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
