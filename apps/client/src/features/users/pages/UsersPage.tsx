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
import type { estado_simple, UserData } from "../../../types";

// --- Servicios ---
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
import UserFormDialog from "../components/UserFormDialog";
import { enqueueSnackbar } from "notistack";
import { useDebounce } from "../../../hooks/useDebounce";

import { roles as RolesEnum } from "../../../types"; // O desde donde venga tu enum 'roles'
import {
  deleteUser,
  findUsers,
  type FindUsersParams,
} from "../services/user.service";

// --- 2. DEFINE LA LISTA DE ROLES DISPONIBLES ---
// (Usamos los valores del enum)
const ROLES_DISPONIBLES = [
  RolesEnum.Administrador,
  RolesEnum.Docente,
  RolesEnum.Alumno,
];

export default function UsersPage() {
  /* ---------------------- ESTADOS ---------------------- */
  // ----- ESTADO PARA LOS DATOS ----- //
  const [data, setData] = useState<{ rows: UserData[]; total: number }>({
    rows: [],
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true); // Para saber si está cargando los usuarios.
  const [error, setError] = useState<string | null>(null); // Para setear errores.

  // ----- ESTADOS PARA LOS FILTROS ----- //
  // Filtro de búsqueda por texto
  const [searchTerm, setSearchTerm] = useState(""); // Búsqueda por nombre, apellido, dni o email
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Custom hook para esperar 500 ms al teclear para realizar la búsqueda

  // Filtro por rol(es): Administrador, Docente o Alumno
  const [roles, setRoles] = useState<string[]>([]);

  // Filtro por estado: Activo, Inactivo o Todos ("")
  const [estado, setEstado] = useState<estado_simple | "">(""); // "" para "Todos"

  // ----- ESTADO PARA PAGINACIÓN ----- //
  const [paginationModel, setPaginationModel] = useState({
    page: 0, // Número de página del DataGrid
    pageSize: 7, // Limite de filas por página en el DataGrid
  });

  // ----- ESTADO PARA ORDENAMIENTO ----- //
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "nombre", sort: "asc" }, // Campo a filtrar, por defecto apellido.
  ]);

  // ----- ESTADOs PARA LOS MODALES (para crear, editar y eliminar) ----- //

  // Estado para el modal de creación o edición
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para settear el curso a editar
  // Este estado se le pasa como prop al Modal (UserData para editar, null para crear).
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  // Estado para settear el usuario a dar de baja
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);

  // Estado del modal para confirmar la baja
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  //Estado de carga si se está eliminando
  const [isDeleting, setIsDeleting] = useState(false);

  /* ---------------------- EFFECTS ---------------------- */

  // ----- EFFECT PARA FETCHING DE USUARIOS ----- //
  useEffect(() => {
    // Definición de la función de fetching
    const fetchUsersConFiltros = async () => {
      setIsLoading(true);
      setError(null);

      // Parámetros para el backend
      const params: FindUsersParams = {
        // Paginación (DataGrid usa 0-index, API usa 1-index)
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,

        // Ordenamiento
        sort: sortModel[0]?.field || "apellido",
        order: sortModel[0]?.sort || "asc",

        // Filtros
        search: debouncedSearchTerm,
        roles: roles,
        estado: estado,
      };

      try {
        // Llamada al servicio
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
    // Array de Dependencias
    // Este hook se re-ejecutará cada vez que uno de estos valores cambie
    debouncedSearchTerm,
    roles,
    estado,
    paginationModel,
    sortModel,
  ]);

  /* ---------------------- HANDLERS ---------------------- */
  const handleAddUserClick = () => {
    setEditingUser(null); // Clear editing state for creation
    setIsModalOpen(true);
  };

  const handleEditClick = (user: UserData) => {
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

  const handleEstadoChange = (event: SelectChangeEvent<string>) => {
    setEstado(event.target.value as estado_simple | "");
  };

  // --- Definición de Columnas para DataGrid ---
  const columns: GridColDef<UserData>[] = [
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
    { field: "genero", headerName: "Género", width: 100 },
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
      align: "center",
      headerAlign: "center",
      // Determina el valor basado en deletedAt
      valueGetter: (value: any, row: UserData): "Activo" | "Inactivo" => {
        return row.deletedAt ? "Inactivo" : "Activo";
      },
      // Renderiza un Chip de color según el estado
      renderCell: (
        params: GridRenderCellParams<UserData, "Activo" | "Inactivo">
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

  const handleRolChange = (event: SelectChangeEvent<typeof roles>) => {
    const {
      target: { value },
    } = event;
    setRoles(
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
            label="Buscar usuario"
            placeholder="Nombre, Apellido, Dni, Email..."
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
              value={roles}
              onChange={handleRolChange}
              input={<OutlinedInput label="Rol" />}
              renderValue={(selected) => selected.join(", ")}
            >
              {/* 3. Mapeamos la constante 'ROLES_DISPONIBLES' */}
              {ROLES_DISPONIBLES.map((rol) => (
                <MenuItem key={rol} value={rol}>
                  {/* Comprobamos si el 'rol' está en el estado 'roles' */}
                  <Checkbox checked={roles.includes(rol)} />
                  <ListItemText primary={rol} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={estado} onChange={handleEstadoChange} label="Estado">
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
          rowCount={data.total} // El total de filas en la BD
          paginationMode="server" // Le dice que la paginación es en el backend
          sortingMode="server" // Le dice que el orden es en el backend
          // --- 2. CONEXIÓN CON EL ESTADO DE PAGINACIÓN ---
          pageSizeOptions={[7, 10, 20]}
          paginationModel={paginationModel} // <-- Lee el estado
          onPaginationModelChange={setPaginationModel} // <-- Actualiza el estado
          // --- 3. CONEXIÓN CON EL ESTADO DE ORDENAMIENTO ---
          sortModel={sortModel} // <-- Lee el estado
          onSortModelChange={setSortModel} // <-- Lee el modelo de ordenamiento
          disableRowSelectionOnClick
          disableColumnResize={true}
          sx={{ height: 476 }}
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
