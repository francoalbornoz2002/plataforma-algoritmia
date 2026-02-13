import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Button,
  Autocomplete,
  TextField,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format, parse } from "date-fns";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { BarChart } from "@mui/x-charts/BarChart";
import VisibilityIcon from "@mui/icons-material/Visibility";

import {
  getCourseClassesHistory,
  type CourseClassesHistoryFilters,
} from "../../service/reports.service";
import { estado_clase_consulta } from "../../../../types";
import ClaseDetailModal from "../../../clases-consulta/components/ClaseDetailModal";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import PdfExportButton from "../common/PdfExportButton";
import ExcelExportButton from "../common/ExcelExportButton";
import { datePickerConfig } from "../../../../config/theme.config";

interface Props {
  courseId: string;
}

export default function CourseClassesHistory({ courseId }: Props) {
  // --- Estados ---
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filters, setFilters] = useState<CourseClassesHistoryFilters>({
    fechaDesde: "",
    fechaHasta: "",
    docenteId: "",
  });

  // Estado para el Autocomplete de Docentes
  const [selectedTeacher, setSelectedTeacher] = useState<{
    id: string;
    nombre: string;
  } | null>(null);

  // Estado para el Modal de Detalle
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Cargar Datos ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getCourseClassesHistory(courseId, filters);
        if (result.chartData) {
          result.chartData = result.chartData.map((d: any) => ({
            ...d,
            fecha: parse(d.fecha, "yyyy-MM-dd", new Date()),
          }));
        }
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el historial de clases.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, filters]);

  // --- Handlers ---
  const handleQuickFilter = (start: string, end: string) => {
    setFilters({
      ...filters,
      fechaDesde: start,
      fechaHasta: end,
    });
  };

  const handleClearFilters = () => {
    setFilters({
      fechaDesde: "",
      fechaHasta: "",
      docenteId: "",
    });
    setSelectedTeacher(null);
  };

  const handleOpenModal = (row: any) => {
    // Adaptamos la fila para que coincida con lo que espera ClaseDetailModal
    // El modal espera un objeto ClaseConsulta con 'consultasEnClase'
    setSelectedClass(row);
    setIsModalOpen(true);
  };

  // --- Columnas DataGrid ---
  const columns: GridColDef[] = [
    {
      field: "fechaAgenda",
      headerName: "Fecha Agenda",
      width: 140,
      valueFormatter: (value: string) =>
        value ? format(new Date(value), "dd/MM/yyyy") : "-",
    },
    { field: "nombre", headerName: "Nombre Clase", width: 200 },
    { field: "docente", headerName: "Docente", width: 180 },
    {
      field: "estado",
      headerName: "Estado",
      width: 115,
      renderCell: (params) => {
        const colors: Record<
          string,
          "default" | "primary" | "success" | "error" | "warning"
        > = {
          Programada: "primary",
          Realizada: "success",
          No_realizada: "error",
          Cancelada: "default",
          En_curso: "warning",
        };
        return (
          <Chip
            label={params.value.replace("_", " ")}
            color={colors[params.value] || "default"}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: "totalConsultas",
      headerName: "Consultas",
      width: 100,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "revisadas",
      headerName: "Revisadas",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Typography
          variant="inherit"
          color={params.value > 0 ? "success.main" : "text.secondary"}
          fontWeight={params.value > 0 ? "bold" : "normal"}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "fechaRealizacion",
      headerName: "Realizada el",
      width: 150,
      valueFormatter: (value: string) =>
        value ? format(new Date(value), "dd/MM/yyyy HH:mm") : "-",
    },
    {
      field: "actions",
      headerName: "Detalle",
      width: 80,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip title="Ver detalle de consultas">
          <IconButton
            color="primary"
            size="small"
            onClick={() => handleOpenModal(params.row)}
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const showLoading = loading && !data;

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="h5"
          gutterBottom
          color="primary.main"
          sx={{ mb: 2, fontWeight: "bold" }}
        >
          Historial de Clases de Consulta
        </Typography>
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}
        >
          <PdfExportButton
            filters={filters}
            endpointPath={`/reportes/cursos/${courseId}/clases-consulta/historial/pdf`}
            disabled={!data}
          />
          <ExcelExportButton
            filters={filters}
            endpointPath={`/reportes/cursos/${courseId}/clases-consulta/historial/excel`}
            disabled={!data}
            filename="historial_clases.xlsx"
          />
        </Box>
      </Stack>

      {/* --- Filtros --- */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <QuickDateFilter onApply={handleQuickFilter} />
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            <DatePicker
              label="Desde"
              disableFuture
              value={
                filters.fechaDesde
                  ? new Date(filters.fechaDesde + "T00:00:00")
                  : null
              }
              onChange={(val) =>
                setFilters({
                  ...filters,
                  fechaDesde: val ? format(val, "yyyy-MM-dd") : "",
                })
              }
              {...datePickerConfig}
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
              label="Hasta"
              disableFuture
              value={
                filters.fechaHasta
                  ? new Date(filters.fechaHasta + "T00:00:00")
                  : null
              }
              onChange={(val) =>
                setFilters({
                  ...filters,
                  fechaHasta: val ? format(val, "yyyy-MM-dd") : "",
                })
              }
              {...datePickerConfig}
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
            <Autocomplete
              options={data?.docentesDisponibles || []}
              getOptionLabel={(option: any) => option.nombre}
              value={selectedTeacher}
              onChange={(_, newValue) => {
                setSelectedTeacher(newValue);
                setFilters({ ...filters, docenteId: newValue?.id || "" });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filtrar por Docente"
                  placeholder="Seleccionar..."
                  size="small"
                />
              )}
              sx={{ width: 300 }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
            <Button variant="text" onClick={handleClearFilters}>
              Limpiar
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {showLoading && (
        <CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {data && !showLoading && (
        <Stack spacing={4}>
          {/* --- Gráfico Apilado --- */}
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">
              Evolución de Consultas por Clase
            </Typography>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Estado de las consultas (Revisadas, Pendientes, A Revisar) según
              el resultado de cada clase.
            </Typography>

            {data.chartData.length > 0 ? (
              <BarChart
                dataset={data.chartData}
                yAxis={[
                  {
                    label: "Cantidad de consultas de la clase",
                    labelStyle: { fontSize: 12 },
                  },
                ]}
                xAxis={[
                  {
                    scaleType: "band",
                    dataKey: "id", // Usamos ID para separar clases del mismo día
                    label: "Fecha - Estado",
                    valueFormatter: (id) => {
                      // Buscamos la fecha correspondiente al ID de la clase
                      const item = data.chartData.find((d: any) => d.id === id);
                      if (!item) return "";
                      const dateStr = format(item.fecha, "dd/MM");
                      const statusStr = item.estado.replace(/_/g, " ");
                      return `${dateStr} - ${statusStr}`;
                    },
                  },
                ]}
                series={[
                  {
                    dataKey: "revisadas",
                    label: "Revisadas",
                    stack: "total",
                    color: "#4caf50", // Verde
                  },
                  {
                    dataKey: "noRevisadas",
                    label: "No Revisadas",
                    stack: "total",
                    color: "#ff9800", // Naranja
                  },
                  {
                    dataKey: "pendientes",
                    label: "Pendientes (No Realizada)",
                    stack: "total",
                    color: "#9e9e9e", // Gris
                  },
                  {
                    dataKey: "aRevisar",
                    label: "A Revisar (Programada)",
                    stack: "total",
                    color: "#1976d2", // Azul
                  },
                ]}
                height={500}
                slotProps={{
                  legend: {
                    direction: "horizontal",
                    position: { vertical: "bottom", horizontal: "center" },
                  },
                }}
              />
            ) : (
              <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                No hay clases para mostrar en el gráfico.
              </Typography>
            )}
          </Paper>

          {/* --- Tabla Detallada --- */}
          <Paper elevation={3} sx={{ height: 600, width: "100%" }}>
            <DataGrid
              rows={data.tableData}
              columns={columns}
              density="compact"
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
                sorting: {
                  sortModel: [{ field: "fechaAgenda", sort: "desc" }],
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
            />
          </Paper>
        </Stack>
      )}

      {/* Modal de Detalle */}
      {selectedClass && (
        <ClaseDetailModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          clase={{
            ...selectedClass,
            // Mapeamos campos para que coincidan con la interfaz ClaseConsulta si es necesario
            estadoClase: selectedClass.estado as estado_clase_consulta,
            fechaClase: selectedClass.fechaAgenda,
          }}
        />
      )}
    </Paper>
  );
}
