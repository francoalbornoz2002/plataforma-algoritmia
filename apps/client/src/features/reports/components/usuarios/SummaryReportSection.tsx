import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  MenuItem,
  Typography,
  Alert,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  getUsersSummary,
  AgrupacionUsuarios,
  type UsersSummaryFilters,
} from "../../service/reports.service";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import PdfExportButton from "../common/PdfExportButton";
import ExcelExportButton from "../common/ExcelExportButton";

// Definimos colores constantes para mantener consistencia
const ROLE_COLORS: Record<string, string> = {
  Administrador: "#9c27b0", // Púrpura
  Docente: "#ed6c02", // Naranja
  Alumno: "#0288d1", // Azul
};

export default function SummaryReportSection() {
  const [filters, setFilters] = useState<UsersSummaryFilters>({
    fechaCorte: "",
    agruparPor: AgrupacionUsuarios.ROL,
  });
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]); // Estado para la lista
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Estado para el filtro interactivo del gráfico
  const [chartFilter, setChartFilter] = useState<{
    rol?: string;
    estado?: string;
  } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      // Consultamos todo en una sola llamada
      const result = await getUsersSummary(filters);

      setSummaryData(result.kpis);
      setDistributionData(result.distribucion);
      setUsersList(result.lista);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el resumen.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales al montar y al cambiar filtros
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Limpiar filtro del gráfico si cambian los filtros principales
  useEffect(() => {
    setChartFilter(null);
  }, [filters.agruparPor]);

  // Filtrar usuarios localmente basado en la selección del gráfico
  const filteredUsers = useMemo(() => {
    if (!chartFilter) return usersList;
    return usersList.filter((user) => {
      const matchRol = chartFilter.rol ? user.rol === chartFilter.rol : true;
      const matchEstado = chartFilter.estado
        ? user.estado === chartFilter.estado
        : true;
      return matchRol && matchEstado;
    });
  }, [usersList, chartFilter]);

  const chartConfig = useMemo(() => {
    if (!distributionData || distributionData.length === 0) return null;

    const totalDistribution = distributionData.reduce(
      (acc: number, curr: any) => acc + curr.cantidad,
      0,
    );

    if (filters.agruparPor === AgrupacionUsuarios.AMBOS) {
      // Validación: Evitar crash si los datos viejos no tienen la estructura esperada (transición)
      if (!distributionData[0].rol) {
        return null;
      }

      const rolesSet = new Set(distributionData.map((d: any) => d.rol));
      const roles = Array.from(rolesSet);

      const dataset: Record<string, any>[] = [
        { estado: "Activo" },
        { estado: "Inactivo" },
      ];

      // Initialize
      dataset.forEach((d: any) => {
        roles.forEach((r) => (d[r] = 0));
      });

      distributionData.forEach((item: any) => {
        const d = dataset.find((x) => x.estado === item.estado);
        if (d) d[item.rol] = item.cantidad;
      });

      return {
        dataset,
        xAxis: [{ scaleType: "band" as const, dataKey: "estado" }],
        series: roles.map((r) => ({
          dataKey: r,
          label: r,
          id: r, // ID necesario para identificar la serie al hacer click
          stack: "total",
          color: ROLE_COLORS[r] || "#0288d1",
          valueFormatter: (value: number | null) =>
            value !== null
              ? `${value} (${((value / totalDistribution) * 100).toFixed(1)}%)`
              : "",
        })),
      };
    }

    // Validación: Evitar crash si los datos viejos no tienen la estructura esperada (transición)
    if (!distributionData[0].grupo) {
      return null;
    }

    if (filters.agruparPor === AgrupacionUsuarios.ESTADO) {
      const activoData = distributionData.find(
        (d: any) => d.grupo === "Activo",
      );
      const inactivoData = distributionData.find(
        (d: any) => d.grupo === "Inactivo",
      );

      const dataset = [
        {
          category: "Total",
          Activo: activoData ? activoData.cantidad : 0,
          Inactivo: inactivoData ? inactivoData.cantidad : 0,
        },
      ];

      return {
        dataset,
        xAxis: [
          {
            scaleType: "band" as const,
            dataKey: "category",
          },
        ],
        series: [
          {
            dataKey: "Activo",
            label: "Activo",
            id: "Activo", // ID para click
            color: "#2e7d32",
            valueFormatter: (value: number | null) =>
              value !== null
                ? `${value} (${((value / totalDistribution) * 100).toFixed(1)}%)`
                : "",
          },
          {
            dataKey: "Inactivo",
            label: "Inactivo",
            id: "Inactivo", // ID para click
            color: "#d32f2f",
            valueFormatter: (value: number | null) =>
              value !== null
                ? `${value} (${((value / totalDistribution) * 100).toFixed(1)}%)`
                : "",
          },
        ],
      };
    }

    // Default: Agrupación por ROL
    // Transformamos los datos para tener múltiples series (una por rol) y así tener leyenda correcta
    const dataset: Record<string, any>[] = [{ category: "Total" }];
    distributionData.forEach((d: any) => {
      dataset[0][d.grupo] = d.cantidad;
    });

    return {
      dataset,
      xAxis: [
        {
          scaleType: "band" as const,
          dataKey: "category",
        },
      ],
      series: distributionData.map((d: any) => ({
        dataKey: d.grupo,
        label: d.grupo,
        id: d.grupo,
        color: ROLE_COLORS[d.grupo] || "#0288d1",
        valueFormatter: (value: number | null) =>
          value !== null
            ? `${value} (${((value / totalDistribution) * 100).toFixed(1)}%)`
            : "",
      })),
    };
  }, [distributionData, filters.agruparPor]);

  // Manejador de clicks en el gráfico
  const handleItemClick = (event: any, identifier: any) => {
    if (!identifier || !chartConfig) return;
    const { seriesId, dataIndex } = identifier;

    if (filters.agruparPor === AgrupacionUsuarios.ROL) {
      // Por Rol: seriesId es el nombre del rol (ej: "Alumno")
      if (typeof seriesId === "string") setChartFilter({ rol: seriesId });
    } else if (filters.agruparPor === AgrupacionUsuarios.ESTADO) {
      // Por Estado: seriesId es "Activo" o "Inactivo" (definido en chartConfig)
      if (typeof seriesId === "string") setChartFilter({ estado: seriesId });
    } else if (filters.agruparPor === AgrupacionUsuarios.AMBOS) {
      // Ambos: seriesId es el Rol, dataIndex apunta al Estado en el dataset
      const estadoItem = chartConfig.dataset[dataIndex];
      // seriesId viene del chart library, aseguramos que sea string (el Rol)
      if (estadoItem && typeof seriesId === "string") {
        // Nota: dataset tiene { estado: 'Activo' } o { estado: 'Inactivo' }
        // seriesId es el Rol (ej: 'Alumno')
        setChartFilter({
          rol: seriesId,
          // @ts-ignore - Sabemos que estado existe en nuestro dataset específico
          estado: estadoItem.estado,
        });
      }
    }
  };

  // Columnas simplificadas para la tabla integrada
  const columns: GridColDef[] = [
    { field: "nombre", headerName: "Nombre", flex: 1, minWidth: 100 },
    { field: "apellido", headerName: "Apellido", flex: 1, minWidth: 100 },
    { field: "rol", headerName: "Rol", flex: 0.8, minWidth: 90 },
    {
      field: "estado",
      headerName: "Estado",
      flex: 0.7,
      minWidth: 90,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === "Activo" ? "success" : "error"}
          variant="filled"
        />
      ),
    },
  ];

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="h5"
          gutterBottom
          sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
        >
          Resumen de usuarios
        </Typography>
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}
        >
          <PdfExportButton
            filters={filters}
            endpointPath="/reportes/usuarios/resumen/pdf"
            disabled={!summaryData}
          />
          <ExcelExportButton
            filters={filters}
            endpointPath="/reportes/usuarios/resumen/excel"
            disabled={!summaryData}
            filename="resumen_usuarios.xlsx"
          />
        </Box>
      </Stack>
      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <DatePicker
            label="Fecha de Corte (Opcional)"
            disableFuture
            value={
              filters.fechaCorte
                ? new Date(filters.fechaCorte + "T00:00:00")
                : null
            }
            onChange={(value) =>
              setFilters({
                ...filters,
                fechaCorte: value ? format(value, "yyyy-MM-dd") : "",
              })
            }
            slotProps={{ textField: { size: "small" } }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Agrupar Distribución Por</InputLabel>
            <Select
              label="Agrupar Distribución Por"
              value={filters.agruparPor}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  agruparPor: e.target.value as AgrupacionUsuarios,
                })
              }
            >
              <MenuItem value={AgrupacionUsuarios.ROL}>Rol</MenuItem>
              <MenuItem value={AgrupacionUsuarios.ESTADO}>Estado</MenuItem>
              <MenuItem value={AgrupacionUsuarios.AMBOS}>Rol y Estado</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      {summaryData && (
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{ width: "100%" }}
        >
          {/* Izquierda: KPIs y Gráfico */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={2} sx={{ height: "100%" }}>
              {/* Columna KPIs */}
              <Paper elevation={3} sx={{ p: 2, minWidth: 140 }}>
                <Stack
                  spacing={2}
                  justifyContent="center"
                  alignItems="center"
                  sx={{ height: "100%" }}
                >
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Total
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {summaryData.total}
                    </Typography>
                  </Box>
                  <Divider flexItem />
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Activos
                    </Typography>
                    <Typography
                      variant="h4"
                      color="success.main"
                      fontWeight="bold"
                    >
                      {summaryData.activos}
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      {summaryData.total > 0
                        ? `${((summaryData.activos / summaryData.total) * 100).toFixed(1)}%`
                        : "0%"}
                    </Typography>
                  </Box>
                  <Divider flexItem />
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Inactivos
                    </Typography>
                    <Typography
                      variant="h4"
                      color="error.main"
                      fontWeight="bold"
                    >
                      {summaryData.inactivos}
                    </Typography>
                    <Typography variant="caption" color="error.main">
                      {summaryData.total > 0
                        ? `${((summaryData.inactivos / summaryData.total) * 100).toFixed(1)}%`
                        : "0%"}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Gráfico */}
              {chartConfig && (
                <Paper elevation={3} sx={{ p: 2, flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" gutterBottom>
                    Distribución
                  </Typography>
                  <BarChart
                    dataset={chartConfig.dataset}
                    xAxis={chartConfig.xAxis}
                    series={chartConfig.series}
                    height={350}
                    onItemClick={handleItemClick}
                  />
                </Paper>
              )}
            </Stack>
          </Box>

          {/* Derecha: Tabla de Usuarios */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">Detalle de Usuarios</Typography>
                {chartFilter && (
                  <Chip
                    label={`Filtro: ${chartFilter.rol || ""} ${
                      chartFilter.estado || ""
                    }`}
                    onDelete={() => setChartFilter(null)}
                    color="primary"
                    size="small"
                  />
                )}
              </Stack>
              <Box sx={{ flex: 1, width: "100%" }}>
                <DataGrid
                  rows={filteredUsers}
                  columns={columns}
                  loading={loading}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                  }}
                  pageSizeOptions={[10, 25, 50]}
                  disableRowSelectionOnClick
                  density="compact"
                  sx={{ height: "100%" }}
                />
              </Box>
            </Paper>
          </Box>
        </Stack>
      )}
    </Paper>
  );
}
