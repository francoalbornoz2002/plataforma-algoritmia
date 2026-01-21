import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Typography,
  Card,
  CardContent,
  Alert,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  getUsersSummary,
  getUsersDistribution,
  AgrupacionUsuarios,
  type UsersSummaryFilters,
  type UsersDistributionFilters,
} from "../service/reports.service";

export default function SummaryReportSection() {
  const [filters, setFilters] = useState<
    UsersSummaryFilters & UsersDistributionFilters
  >({
    fechaCorte: "",
    agruparPor: AgrupacionUsuarios.ROL,
  });
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, dist] = await Promise.all([
        getUsersSummary({ fechaCorte: filters.fechaCorte }),
        getUsersDistribution({
          fechaCorte: filters.fechaCorte,
          agruparPor: filters.agruparPor,
        }),
      ]);
      setSummaryData(summary);
      setDistributionData(dist);
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

  const chartConfig = useMemo(() => {
    if (!distributionData || distributionData.length === 0) return null;

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
        series: roles.map((r) => ({ dataKey: r, label: r, stack: "total" })),
      };
    }

    // Validación: Evitar crash si los datos viejos no tienen la estructura esperada (transición)
    if (!distributionData[0].grupo) {
      return null;
    }

    return {
      dataset: distributionData,
      xAxis: [{ scaleType: "band" as const, dataKey: "grupo" }],
      series: [{ dataKey: "cantidad", label: "Cantidad", color: "#0288d1" }],
    };
  }, [distributionData, filters.agruparPor]);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
      >
        Resumen y Estadísticas
      </Typography>
      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
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

      {/* Acciones de Exportación */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          disabled={!summaryData}
          color="error"
        >
          Exportar PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<TableOnIcon />}
          disabled={!summaryData}
          color="success"
        >
          Exportar Excel
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {summaryData && (
        <>
          <Typography variant="h6" gutterBottom>
            KPIs Globales
          </Typography>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid sx={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Total Usuarios</Typography>
                  <Typography variant="h3">{summaryData.total}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid sx={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Activos</Typography>
                  <Typography variant="h3" color="success.main">
                    {summaryData.activos}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid sx={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Inactivos</Typography>
                  <Typography variant="h3" color="error.main">
                    {summaryData.inactivos}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            Distribución de Usuarios
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {distributionData.map((item, index) => (
              <Grid sx={{ xs: 12, md: 4 }} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {item.grupo || `${item.rol} - ${item.estado}`}
                    </Typography>
                    <Typography variant="h5">{item.cantidad}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {chartConfig && (
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Gráfico de Distribución
              </Typography>
              <BarChart
                dataset={chartConfig.dataset}
                xAxis={chartConfig.xAxis}
                series={chartConfig.series}
                height={350}
              />
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}
