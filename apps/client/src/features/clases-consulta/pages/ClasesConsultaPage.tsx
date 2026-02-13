import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import { School } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// 1. Hooks, Servicios y Tipos
import { useCourseContext } from "../../../context/CourseContext";
import {
  findActiveDocentes,
  findPendingConsultas,
} from "../../users/services/docentes.service";
import {
  aceptarClaseAutomatica,
  finalizarClase,
  findAllClasesByCurso,
} from "../services/clases-consulta.service";
import {
  type ClaseConsulta,
  type DocenteBasico,
  type ConsultaSimple,
  estado_clase_consulta,
} from "../../../types";

// 2. Componentes Hijos
import ClaseConsultaCard from "../components/ClaseConsultaCard";
import ClaseConsultaFormModal from "../components/ClaseConsultaFormModal";
import DeleteClaseDialog from "../components/DeleteClaseDialog";
import ClaseDetailModal from "../components/ClaseDetailModal";
import { useSearchParams } from "react-router";
import AceptarManualModal from "../components/AceptarManualModal";
import { enqueueSnackbar } from "notistack";
import ActionConfirmationDialog from "../components/ActionConfirmationDialog";
import { FinalizarClaseModal } from "../components/FinalizarClaseModal";
import HeaderPage from "../../../components/HeaderPage";
import { datePickerConfig } from "../../../config/theme.config";

// Tipos para los filtros
type OrdenFiltro =
  | "fecha-desc"
  | "fecha-asc"
  | "consultas-desc"
  | "consultas-asc";

export default function ClasesConsultaPage() {
  const { selectedCourse, isReadOnly } = useCourseContext();

  // --- Estados de Datos (Precarga) ---
  const [allClases, setAllClases] = useState<ClaseConsulta[]>([]);
  const [docentesList, setDocentesList] = useState<DocenteBasico[]>([]);
  const [consultasList, setConsultasList] = useState<ConsultaSimple[]>([]);

  // --- Estados de Carga/Error ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Estados de Filtros y Orden ---
  const [fechaDesde, setFechaDesde] = useState<Date | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null);
  const [docenteFiltro, setDocenteFiltro] = useState("Todos");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [orden, setOrden] = useState<OrdenFiltro>("fecha-desc");

  // --- Estados de Modales ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [claseToEdit, setClaseToEdit] = useState<ClaseConsulta | null>(null);
  const [claseToDelete, setClaseToDelete] = useState<ClaseConsulta | null>(
    null,
  );
  const [claseToView, setClaseToView] = useState<ClaseConsulta | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  // Estado para controlar el nuevo modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [selectedClaseForManual, setSelectedClaseForManual] =
    useState<ClaseConsulta | null>(null);
  // 2. ESTADO PARA EL DIÁLOGO DE ACCIÓN
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>; // Función asíncrona
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: async () => {},
  });

  // Estado local de carga para el diálogo
  const [actionLoading, setActionLoading] = useState(false);

  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [claseToFinalize, setClaseToFinalize] = useState<ClaseConsulta | null>(
    null,
  );
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    const action = searchParams.get("action");
    const idClase = searchParams.get("id");
    const nextDateIso = searchParams.get("date");

    // Solo ejecutamos si tenemos la clase cargada en 'allClases'
    if (action && idClase && allClases.length > 0) {
      const claseTarget = allClases.find((c) => c.id === idClase);
      if (!claseTarget) return;

      handleDeepLinkAction(action, claseTarget, nextDateIso);
    }
  }, [searchParams, allClases]); // Se ejecuta al cargar las clases

  // Handler para ABRIR el modal (se pasa al Card)
  const handleOpenFinalize = (clase: ClaseConsulta) => {
    setClaseToFinalize(clase);
    setFinalizeModalOpen(true);
  };

  // Handler para CONFIRMAR (se pasa al Modal)
  const handleConfirmFinalize = async (data: any) => {
    if (!claseToFinalize) return;
    setIsFinalizing(true);
    try {
      await finalizarClase(claseToFinalize.id, data);
      enqueueSnackbar("Clase finalizada correctamente", {
        variant: "success",
      });
      fetchData(); // ¡Importante! Recargar para ver el cambio de estado y chip
      setFinalizeModalOpen(false);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error al finalizar la clase", {
        variant: "error",
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleDeepLinkAction = async (
    action: string,
    clase: ClaseConsulta,
    nextDateIso: string | null,
  ) => {
    // Limpiamos URL
    setSearchParams({});

    try {
      // --- CASO 1: ACEPTAR ORIGINAL ---
      if (action === "accept") {
        // Formateo de fecha para el mensaje
        const [year, month, day] = clase.fechaInicio.split("T")[0].split("-");
        const fechaVisual = `${day}/${month}/${year}`;

        // Abrimos el diálogo en lugar de window.confirm
        setActionDialog({
          open: true,
          title: "Confirmar Asignación",
          message: `¿Deseas aceptar y asignarte la clase de consulta automática para el ${fechaVisual}?`,
          onConfirm: async () => {
            // Llamamos a tu lógica existente
            await handleAcceptClass(clase);
          },
        });
      }

      // --- CASO 2: REPROGRAMAR (SIGUIENTE) ---
      else if (action === "reschedule" && nextDateIso) {
        const fechaObj = new Date(nextDateIso);
        const fechaVisual = fechaObj.toLocaleDateString("es-AR");
        const horaVisual = fechaObj.toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        setActionDialog({
          open: true,
          title: "Confirmar Reprogramación",
          message: `¿Aceptar la clase pero reprogramarla al ${fechaVisual} a las ${horaVisual}?`,
          onConfirm: async () => {
            try {
              // Llamamos al servicio de reprogramar (usando el endpoint que acepta fecha)
              await aceptarClaseAutomatica(clase.id, nextDateIso);
              enqueueSnackbar("Clase reprogramada y aceptada correctamente.", {
                variant: "success",
              }); // O usar enqueueSnackbar
              fetchData();
            } catch (e: any) {
              enqueueSnackbar(e.message || "Error al reprogramar", {
                variant: "error",
              });
            }
          },
        });
      }

      // --- CASO 3: MANUAL (Abrir Modal) ---
      else if (action === "edit_manual") {
        setSelectedClaseForManual(clase);
        setManualModalOpen(true);
      }
    } catch (error) {
      enqueueSnackbar("Ocurrió un error al procesar la acción.", {
        variant: "error",
      });
    }
  };

  // --- Data Fetching (Cliente) ---
  const fetchData = () => {
    if (!selectedCourse) return;
    setLoading(true);
    setError(null);

    // 1. Pedimos los 3 sets de datos en paralelo
    Promise.all([
      findAllClasesByCurso(selectedCourse.id),
      findActiveDocentes(selectedCourse.id),
      findPendingConsultas(selectedCourse.id),
    ])
      .then(([clasesData, docentesData, consultasData]) => {
        setAllClases(clasesData);
        setDocentesList(docentesData);
        setConsultasList(consultasData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [selectedCourse]);

  // --- Lógica de Filtros y Orden (Cliente) ---
  const clasesFiltradasYOrdenadas = useMemo(() => {
    let clases = [...allClases];

    // 1. Filtrar
    if (docenteFiltro !== "Todos") {
      clases = clases.filter((c) => c.idDocente === docenteFiltro);
    }
    if (estadoFiltro !== "Todos") {
      clases = clases.filter((c) => c.estadoClase === estadoFiltro);
    }
    if (fechaDesde) {
      clases = clases.filter((c) => new Date(c.fechaInicio) >= fechaDesde);
    }
    if (fechaHasta) {
      clases = clases.filter((c) => new Date(c.fechaInicio) <= fechaHasta);
    }

    // 2. Ordenar
    switch (orden) {
      case "fecha-asc":
        clases.sort(
          (a, b) =>
            new Date(a.fechaInicio).getTime() -
            new Date(b.fechaInicio).getTime(),
        );
        break;
      case "consultas-desc":
        clases.sort(
          (a, b) => b.consultasEnClase.length - a.consultasEnClase.length,
        );
        break;
      case "consultas-asc":
        clases.sort(
          (a, b) => a.consultasEnClase.length - b.consultasEnClase.length,
        );
        break;
      case "fecha-desc":
      default:
        clases.sort(
          (a, b) =>
            new Date(b.fechaInicio).getTime() -
            new Date(a.fechaInicio).getTime(),
        );
    }

    return clases;
  }, [allClases, docenteFiltro, estadoFiltro, fechaDesde, fechaHasta, orden]);

  // --- Handlers ---
  const handleOpenCreate = () => {
    setClaseToEdit(null); // Asegurarse de que esté en modo "Crear"
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (clase: ClaseConsulta) => {
    setClaseToEdit(clase); // Pone el objeto en modo "Editar"
    setIsFormModalOpen(true);
  };

  const handleClearFilters = () => {
    setFechaDesde(null);
    setFechaHasta(null);
    setDocenteFiltro("Todos");
    setEstadoFiltro("Todos");
    setOrden("fecha-desc");
  };

  const handleSaveSuccess = () => {
    fetchData(); // Refresca toda la data
  };

  // Handler para el botón "Aceptar Clase"
  const handleAcceptClass = async (clase: ClaseConsulta) => {
    try {
      await aceptarClaseAutomatica(clase.id);

      // Feedback de éxito
      enqueueSnackbar(
        `¡Has aceptado la clase "${clase.nombre}" exitosamente!`,
        {
          variant: "success",
        },
      );

      // Recargamos la lista para que se actualice la UI (cambie de botón verde a botones normales)
      fetchData();
    } catch (error: any) {
      enqueueSnackbar(error.message, {
        variant: "error",
      });
      fetchData(); // Recargamos por si el estado cambió
    }
  };

  // 4. Wrapper para ejecutar la acción del diálogo y manejar loading/cerrar
  const handleConfirmAction = async () => {
    if (!actionDialog.onConfirm) return;

    setActionLoading(true);
    try {
      await actionDialog.onConfirm();
      // Si todo sale bien, cerramos
      setActionDialog((prev) => ({ ...prev, open: false }));
    } catch (error) {
      console.error(error);
      // El error ya debería haber sido manejado (alert) dentro de onConfirm,
      // o puedes mostrarlo aquí si prefieres.
    } finally {
      setActionLoading(false);
    }
  };

  if (!selectedCourse) {
    return (
      <Alert severity="info">
        Por favor, selecciona un curso desde tu menú.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        {/* --- TÍTULO --- */}
        <HeaderPage
          title={`Clases de Consulta en ${selectedCourse.nombre}`}
          description="Gestiona las clases de consulta programadas para resolver dudas de los alumnos."
          icon={<School />}
          color="primary"
        />

        {/* --- 1. Filtros y Orden --- */}
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          alignItems="center"
        >
          <DatePicker
            label="Fecha Desde"
            value={fechaDesde}
            onChange={setFechaDesde}
            slotProps={{
              textField: {
                ...datePickerConfig.slotProps.textField,
                InputProps: {
                  sx: {
                    ...datePickerConfig.slotProps.textField.InputProps.sx,
                    width: 170,
                  },
                },
                sx: { width: 170 },
              },
            }}
          />

          <DatePicker
            label="Fecha Hasta"
            value={fechaHasta}
            onChange={setFechaHasta}
            slotProps={{
              textField: {
                ...datePickerConfig.slotProps.textField,
                InputProps: {
                  sx: {
                    ...datePickerConfig.slotProps.textField.InputProps.sx,
                    width: 170,
                  },
                },
                sx: { width: 170 },
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Docente</InputLabel>
            <Select
              value={docenteFiltro}
              label="Docente"
              onChange={(e) => setDocenteFiltro(e.target.value)}
            >
              <MenuItem value="Todos">Todos</MenuItem>
              {docentesList.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.nombre} {d.apellido}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={estadoFiltro}
              label="Estado"
              onChange={(e) => setEstadoFiltro(e.target.value)}
            >
              <MenuItem value="Todos">Todos</MenuItem>
              {Object.values(estado_clase_consulta).map((e) => (
                <MenuItem key={e} value={e}>
                  {e.replace("_", " ")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={orden}
              label="Ordenar por"
              onChange={(e) => setOrden(e.target.value as OrdenFiltro)}
            >
              <MenuItem value="fecha-desc">Más Recientes</MenuItem>
              <MenuItem value="fecha-asc">Más Antiguas</MenuItem>
              <MenuItem value="consultas-desc">
                Cant. Consultas (Mayor)
              </MenuItem>
              <MenuItem value="consultas-asc">Cant. Consultas (Menor)</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Limpiar filtros">
            <IconButton
              onClick={handleClearFilters}
              size="small"
              color="primary"
            >
              <FilterAltOffIcon />
            </IconButton>
          </Tooltip>

          <Box sx={{ flexGrow: 1 }} />
          {!isReadOnly && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Crear Clase
            </Button>
          )}
        </Stack>

        {/* --- 2. Lista de Clases (Cards) --- */}
        {loading ? (
          <CircularProgress sx={{ display: "block", margin: "auto", mt: 4 }} />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box>
            {clasesFiltradasYOrdenadas.length === 0 ? (
              <Alert severity="info">
                No se encontraron clases de consulta con los filtros aplicados.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {clasesFiltradasYOrdenadas.map((clase) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={clase.id}>
                    <ClaseConsultaCard
                      clase={clase}
                      onEdit={!isReadOnly ? handleOpenEdit : () => {}}
                      onDelete={!isReadOnly ? setClaseToDelete : () => {}}
                      onViewDetails={setClaseToView}
                      onAccept={!isReadOnly ? handleAcceptClass : undefined}
                      onFinalize={!isReadOnly ? handleOpenFinalize : undefined}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Stack>

      {/* --- 3. Modales --- */}
      {/* (El modal de Crear/Editar se renderiza solo cuando 'isModalOpen' es true) */}
      <ClaseConsultaFormModal
        open={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveSuccess}
        claseToEdit={claseToEdit}
        docentesList={docentesList}
        consultasList={consultasList}
      />

      {claseToDelete && (
        <DeleteClaseDialog
          open={!!claseToDelete}
          onClose={() => setClaseToDelete(null)}
          onDeleteSuccess={handleSaveSuccess}
          clase={claseToDelete}
        />
      )}

      {claseToView && (
        <ClaseDetailModal
          open={!!claseToView}
          onClose={() => setClaseToView(null)}
          clase={claseToView}
        />
      )}
      {/* Renderizas el nuevo modal al final */}
      <AceptarManualModal
        open={manualModalOpen}
        clase={selectedClaseForManual}
        onClose={() => {
          setManualModalOpen(false);
          setSelectedClaseForManual(null);
        }}
        onSuccess={() => {
          fetchData(); // Refrescar la lista al terminar
        }}
      />
      {/* 5. RENDERIZAR EL NUEVO DIÁLOGO AL FINAL */}
      <ActionConfirmationDialog
        open={actionDialog.open}
        onClose={() => setActionDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={handleConfirmAction}
        title={actionDialog.title}
        message={actionDialog.message}
        loading={actionLoading}
        confirmText="Confirmar"
      />

      <FinalizarClaseModal
        open={finalizeModalOpen}
        onClose={() => setFinalizeModalOpen(false)}
        onConfirm={handleConfirmFinalize}
        clase={claseToFinalize}
        isLoading={isFinalizing}
      />
    </Box>
  );
}
