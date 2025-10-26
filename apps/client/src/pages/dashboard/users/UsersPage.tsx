import { useEffect, useState } from "react";
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
  type GridSortModel,
} from "@mui/x-data-grid";
import { format, parseISO } from "date-fns"; // Para formatear fecha
import { es } from "date-fns/locale/es"; // Para formato español
import type { User } from "../../../types";

// --- Servicios ---
import { deleteUser, findUsers } from "../../../services/user.service";
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
import { useDebounce } from "../../../hooks/useDebounce";

export default function UsersPage() {
  // --- 1. ESTADOS PARA LOS FILTROS ---

  // Para el buscador (ej: "Juan")
  const [searchTerm, setSearchTerm] = useState("");
  // Este valor solo se actualizará 500ms después de que el usuario deje de teclear
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [rolName, serRolName] = useState<string[]>([]);
  // Para el Select de Estado (ej: "true", "false", o "")
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");

  // --- 2. ESTADOS PARA PAGINACIÓN Y ORDEN ---

  // Para la paginación del DataGrid
  const [paginationModel, setPaginationModel] = useState({
    page: 0, // DataGrid empieza en página 0
    pageSize: 6, // El 'pageSize' del <DataGrid>
  });

  // Para el ordenamiento del DataGrid
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "apellido", sort: "asc" }, // Tu orden por defecto
  ]);

  // --- 3. ESTADO PARA LOS DATOS ---

  // 'users' ya no es suficiente, necesitas el conteo total
  const [data, setData] = useState<{ rows: User[]; total: number }>({
    rows: [],
    total: 0,
  });

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

  useEffect(() => {
    // 1. Definimos la función de fetching DENTRO del hook
    const fetchUsersConFiltros = async () => {
      setIsLoading(true);
      setError(null);

      // 2. Prepara los parámetros para el backend
      const params = {
        // Paginación (DataGrid usa 0-index, API usa 1-index)
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,

        // Ordenamiento
        sort: sortModel[0]?.field || "apellido",
        order: sortModel[0]?.sort || "asc",

        // Filtros
        search: debouncedSearchTerm, // ¡Usa el valor retrasado!
        roles: rolName, // Tu estado de roles
        estado: estadoSeleccionado,
      };

      try {
        // 3. Llama al NUEVO servicio (que crearemos en el Paso 4)
        // Esta línea dará error temporalmente, es normal.
        const response = await findUsers(params);
        setData({
          rows: response.data,
          total: response.total,
        });
      } catch (err: any) {
        console.error("Error fetching users:", err);
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Error al cargar los usuarios."
        );
        setData({ rows: [], total: 0 }); // Limpia los datos en caso de error
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsersConFiltros(); // Llama a la función de fetch
  }, [
    // 5. ¡Array de Dependencias!
    // Este hook se re-ejecutará CADA VEZ que uno de estos valores cambie
    debouncedSearchTerm,
    rolName,
    estadoSeleccionado,
    paginationModel,
    sortModel,
  ]);

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
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
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
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
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

      {/* --- Sección de Filtros y Botón de crear usuario --- */}
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 300 }}
            variant="outlined"
          />
          <FormControl size="small" sx={{ m: 1, width: 300 }}>
            <InputLabel id="multiple-checkbox-label">Rol</InputLabel>
            <Select
              labelId="multiple-checkbox-label"
              id="demo-multiple-checkbox"
              multiple
              value={rolName}
              onChange={handleRolChange}
              input={<OutlinedInput label="Tag" />}
              renderValue={(selected) => selected.join(", ")}
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
              value={estadoSeleccionado}
              onChange={(e) => setEstadoSeleccionado(e.target.value)}
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
          rows={data.rows}
          columns={columns}
          loading={isLoading}
          getRowId={(row) => row.id}
          // --- 1. CONEXIÓN CON EL SERVIDOR ---
          rowCount={data.total} // <-- ¡Muy importante! El total de filas en la BD
          paginationMode="server" // <-- Le dice que la paginación es en el backend
          sortingMode="server" // <-- Le dice que el orden es en el backend
          // --- 2. CONEXIÓN CON EL ESTADO DE PAGINACIÓN ---
          // (Tu 'initialState' tenía 6, pero 'pageSizeOptions' [5]. Los unificamos)
          pageSizeOptions={[6, 10, 20]}
          paginationModel={paginationModel} // <-- Lee el estado
          onPaginationModelChange={setPaginationModel} // <-- Actualiza el estado
          // --- 3. CONEXIÓN CON EL ESTADO DE ORDENAMIENTO ---
          sortModel={sortModel} // <-- Lee el estado
          onSortModelChange={setSortModel} // <-- ¡Esta es la línea que querías!
          // --- Tus otras props ---
          disableRowSelectionOnClick
          disableColumnResize={true}
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
