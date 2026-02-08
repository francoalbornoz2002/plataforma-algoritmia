import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import { useCourseContext } from "../../context/CourseContext";
import {
  getStudentProgressList,
  removeStudentFromCourse,
} from "../users/services/docentes.service";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import { enqueueSnackbar } from "notistack";

export default function DocenteDashboardPage() {
  const { selectedCourse, isReadOnly } = useCourseContext();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Estado para el diálogo de confirmación
  const [studentToDelete, setStudentToDelete] = useState<{
    id: string;
    nombre: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStudents = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    setError(null);
    try {
      // Reutilizamos el servicio de progreso que ya trae la lista de alumnos
      const response = await getStudentProgressList(selectedCourse.id, {
        page: 1,
        limit: 100, // Traemos suficientes para el dashboard
        sort: "apellido",
        order: "asc",
      });
      setStudents(response.data);
    } catch (err: any) {
      setError(err.message || "Error al cargar alumnos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse]);

  const handleRemoveClick = (student: any) => {
    setStudentToDelete({
      id: student.idAlumno, // Ojo: getStudentProgressList devuelve idAlumno
      nombre: `${student.nombre} ${student.apellido}`,
    });
  };

  const confirmRemove = async () => {
    if (!selectedCourse || !studentToDelete) return;

    setIsDeleting(true);
    try {
      await removeStudentFromCourse(selectedCourse.id, studentToDelete.id);
      enqueueSnackbar("Alumno dado de baja correctamente", {
        variant: "success",
      });
      setStudentToDelete(null);
      fetchStudents(); // Recargar lista
    } catch (err: any) {
      enqueueSnackbar(err.message || "Error al dar de baja", {
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: GridColDef[] = [
    { field: "apellido", headerName: "Apellido", flex: 1 },
    { field: "nombre", headerName: "Nombre", flex: 1 },
    {
      field: "actions",
      headerName: "Acciones",
      width: 100,
      sortable: false,
      renderCell: (params) => {
        // No mostrar botón si es solo lectura
        if (isReadOnly) return null;

        return (
          <Tooltip title="Dar de baja del curso">
            <IconButton
              color="error"
              size="small"
              onClick={() => handleRemoveClick(params.row)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

  if (!selectedCourse) {
    return (
      <Alert severity="info">Selecciona un curso para ver el panel.</Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard del Docente
      </Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
        Gestión rápida de alumnos del curso:{" "}
        <strong>{selectedCourse.nombre}</strong>
      </Typography>

      <Paper elevation={2} sx={{ height: 500, width: "100%", p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Listado de Alumnos Activos
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <DataGrid
          rows={students}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25]}
          disableRowSelectionOnClick
          density="compact"
          // getStudentProgressList devuelve 'id' como idProgreso, usamos idAlumno como key si es necesario,
          // pero DataGrid usa 'id' por defecto. Verificamos que 'id' sea único (lo es).
        />
      </Paper>

      <ConfirmationDialog
        open={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={confirmRemove}
        title="Dar de baja alumno"
        description={`¿Estás seguro de que deseas dar de baja a ${studentToDelete?.nombre} de este curso? Esta acción cancelará sus sesiones pendientes y cerrará sus consultas. ⚠️ IMPORTANTE: Esta acción no se puede deshacer y el alumno NO puede volver a ser inscripto en el curso.`}
        isLoading={isDeleting}
        confirmText="Dar de baja"
      />
    </Box>
  );
}
