import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip"; // Para el estado
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import { format, parseISO } from "date-fns"; // Para formatear fecha
import { es } from "date-fns/locale/es"; // Para formato español
import type { User } from "../../../types";

// --- Servicios ---
import { getAllUsers, deleteUser } from "../../../services/user.service";
import {
  Alert,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  type SelectChangeEvent,
} from "@mui/material";
import UserFormDialog from "./UserFormDialog";
import { enqueueSnackbar } from "notistack";

export default function UsersPage() {
  // Para setear los usuarios en la tabla principal.
  const [users, setUsers] = useState<User[]>([]);

  //Para saber si está cargando los usuarios.
  const [isLoading, setIsLoading] = useState(true);

  //Para setear errores.
  const [error, setError] = useState<string | null>(null);

  // Estado para la creación o edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null); // null for create, User object for edit

  // Estado para abrir y cerrar el dialog de delete.
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  //Estado para setear el usuario a eliminar
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);

  //Estado de carga si se está eliminando
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Error al cargar los usuarios."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Obtiene los usuarios cuando el componente se renderiza
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- Handlers ---
  const handleAddUserClick = () => {
    setEditingUser(null); // Clear editing state for creation
    setIsModalOpen(true);
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user); // Set the user to edit
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setUserToDeleteId(id); // Store ID of user to delete
    setIsDeleteDialogOpen(true); // Open confirmation dialog
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setUserToDeleteId(null);
  };

  const confirmDelete = async () => {
    if (!userToDeleteId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteUser(userToDeleteId);
      handleCloseDeleteDialog();
      enqueueSnackbar("Usuario dado de baja con éxito", {
        variant: "success",
        autoHideDuration: 3000,
      });
      await fetchUsers();
    } catch (err: any) {
      console.error("Error deleting user:", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Error al dar de baja al usuario."
      );
      // Keep dialog open on error? Or close? User decision.
      // handleCloseDeleteDialog(); // Close even on error?
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null); // Clear editing state when closing
  };

  const handleSaveUser = async () => {
    setError(null); // Limpia errores previos
    try {
      handleCloseModal(); // Cierra el modal si tiene éxito
      await fetchUsers(); // Refresca la lista de usuarios
      // Opcional: Mostrar Snackbar de éxito
    } catch (err: any) {
      console.error("Error saving user:", err);
      // Pasa el error al diálogo para que lo muestre (o muéstralo aquí)
      // Nota: El diálogo ya tiene su propio estado de error, podrías
      //       confiar en él o mostrar un Snackbar aquí.
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Error al guardar el usuario."
      );
    }
  };

  // --- Definición de Columnas para DataGrid ---
  const columns: GridColDef<User>[] = [
    // ID (generalmente se oculta o se usa para lógica interna)
    // { field: 'id', headerName: 'ID', width: 90 },
    { field: "nombre", headerName: "Nombre", width: 150, editable: false }, // Editable: false si no usas edición inline
    { field: "apellido", headerName: "Apellido", width: 150 },
    {
      field: "dni",
      headerName: "DNI",
      width: 110,
    },
    {
      field: "fechaNacimiento",
      headerName: "Fecha de nac.",
      width: 120,
      // Formatea la fecha para mostrarla
      valueFormatter: (value: string | Date | null) => {
        if (!value) return "";
        try {
          const dateObj = typeof value === "string" ? parseISO(value) : value;
          return format(dateObj, "dd/MM/yyyy", { locale: es });
        } catch {
          return "Inválida";
        }
      },
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      minWidth: 180,
    },
    { field: "rol", headerName: "Rol", width: 120 },
    {
      field: "estado",
      headerName: "Estado",
      width: 100,
      // Determina el valor basado en deletedAt
      valueGetter: (value: any, row: User): "Activo" | "Inactivo" => {
        return row.deletedAt ? "Inactivo" : "Activo";
      },
      // Renderiza un Chip de color según el estado
      renderCell: (
        params: GridRenderCellParams<User, "Activo" | "Inactivo">
      ) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === "Activo" ? "success" : "error"}
          variant="filled"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 100,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box>
          <Tooltip title="Editar Usuario">
            {/* Desabilita el botón de edición si está inactivo */}
            <span>
              <IconButton
                onClick={() => handleEditClick(params.row)}
                size="small"
                disabled={!!params.row.deletedAt}
              >
                <EditIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Dar de baja Usuario">
            <span>
              <IconButton
                onClick={() => handleDeleteClick(params.row.id)}
                size="small"
                color="error"
                disabled={!!params.row.deletedAt}
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const rolesDisponibles = ["ADMIN", "DOCENTE", "ALUMNO"];

  const [rolName, serRolName] = useState<string[]>([]);

  const handleRolChange = (event: SelectChangeEvent<typeof rolName>) => {
    const {
      target: { value },
    } = event;
    serRolName(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Gestión de Usuarios
      </Typography>

      {/* --- Sección de Filtros y Botón --- */}
      <Box
        sx={{
          mb: 2,
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
          flexGrow: 1,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            label="Buscar usuario..."
            variant="outlined"
          />
          <FormControl size="small" sx={{ m: 1, width: 300 }}>
            <InputLabel id="demo-multiple-checkbox-label">Rol</InputLabel>
            <Select
              labelId="demo-multiple-checkbox-label"
              id="demo-multiple-checkbox"
              multiple
              value={rolName}
              onChange={handleRolChange}
              input={<OutlinedInput label="Tag" />}
              renderValue={(selected) => selected.join(", ")}
              //MenuProps={MenuProps}
            >
              {rolesDisponibles.map((rol) => (
                <MenuItem key={rol} value={rol}>
                  <Checkbox checked={rolName.includes(rol)} />
                  <ListItemText primary={rol} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              //value={estado}
              //onChange={(e) => setEstado(e.target.value)}
              label="Estado"
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              <MenuItem value="true">Activo</MenuItem>
              <MenuItem value="false">Inactivo</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddUserClick}
            disabled={isLoading}
          >
            Añadir Usuario
          </Button>
        </Stack>
      </Box>

      {/* Muestra un error si falló la carga */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {" "}
          {/* Allow closing the error */}
          {error}
        </Alert>
      )}

      {/* --- Tabla de Datos --- */}
      <Box sx={{ flexGrow: 1, width: "100%" }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={isLoading}
          initialState={{
            pagination: { paginationModel: { page: 0, pageSize: 6 } },
          }}
          pageSizeOptions={[5]}
          disableRowSelectionOnClick
          disableColumnResize={true}
          // Necesario si tus IDs no se llaman 'id' o para asegurar unicidad
          getRowId={(row) => row.id}
        />
      </Box>
      {/* --- Dialog/Modal para Crear/Editar Usuario --- */}
      {
        <UserFormDialog
          open={isModalOpen}
          onClose={handleCloseModal}
          userToEdit={editingUser}
          onSave={handleSaveUser} // Pasamos la función de guardado/refresco
        />
      }

      {/* --- Dialogo de Confirmación de Borrado --- */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmar Baja de Usuario
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Estás seguro de que quieres dar de baja a este usuario? Esta acción
            marcará al usuario como inactivo.
          </DialogContentText>
          {/* Muestra error específico del borrado si ocurre */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            disabled={isDeleting}
            autoFocus
          >
            {isDeleting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Confirmar Baja"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
