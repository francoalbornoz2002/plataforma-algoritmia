import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Button,
  Grid,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FunctionsIcon from "@mui/icons-material/Functions";
import { PieChart } from "@mui/x-charts/PieChart";

import {
  getCourseClassesSummary,
  type CourseClassesSummaryFilters,
} from "../../service/reports.service";
import QuickDateFilter from "../../../../components/QuickDateFilter";
import ReportTotalCard from "../common/ReportTotalCard";
import ReportTextualCard from "../common/ReportTextualCard";

interface Props {
  courseId: string;
}

export default function CourseClassesSummary({ courseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CourseClassesSummaryFilters>({
    fechaDesde: "",
    fechaHasta: "",
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getCourseClassesSummary(courseId, filters);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el resumen de clases de consulta.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, filters]);

  const handleClearFilters = () => {
    setFilters({ fechaDesde: "", fechaHasta: "" });
  };

  const handleQuickFilter = (start: string, end: string) => {
    setFilters({
      ...filters,
      fechaDesde: start,
      fechaHasta: end,
    });
  };

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
          Resumen de Clases de Consulta
        </Typography>
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}
        >
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            disabled={!data}
            color="error"
          >
            Exportar PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<TableOnIcon />}
            disabled={!data}
            color="success"
          >
            Exportar Excel
          </Button>
        </Box>
      </Stack>

      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <QuickDateFilter onApply={handleQuickFilter} />
        <Box sx={{ mt: 2 }} />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          <DatePicker
            label="Fecha Desde"
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
            slotProps={{ textField: { size: "small", sx: { width: 200 } } }}
          />
          <DatePicker
            label="Fecha Hasta"
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
            slotProps={{ textField: { size: "small", sx: { width: 200 } } }}
          />
          <Button variant="text" onClick={handleClearFilters}>
            Limpiar
          </Button>
        </Stack>
      </Paper>

      {showLoading && (
        <CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {data && !showLoading && (
        <Stack spacing={3}>
          {/* KPIs Generales */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <ReportTotalCard
                resourceName="Clases"
                total={data.kpis.totalClases}
                active={data.kpis.activas}
                inactive={data.kpis.inactivas}
                icon={<FunctionsIcon fontSize="small" />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <ReportTextualCard
                icon={<FunctionsIcon />}
                title="Promedio Consultas/Clase"
                value={data.kpis.promConsultasPorClase.toFixed(1)}
                description="Consultas agendadas por clase activa."
                color="primary"
              />
            </Grid>

            {/* Efectividad de Revisión */}
            <Grid size={{ xs: 12, md: 6 }}>
              <ReportTextualCard
                icon={<FactCheckIcon />}
                title="Efectividad de Revisión en Vivo"
                value={`${data.efectividad.promedioRevisadasPct.toFixed(1)}%`}
                description={
                  <>
                    En promedio, el{" "}
                    <b>{data.efectividad.promedioRevisadasPct.toFixed(1)}%</b>{" "}
                    de las consultas agendadas son revisadas en clase.
                  </>
                }
                color="info"
              />
            </Grid>
          </Grid>

          <Divider />

          <Grid container spacing={3}>
            {/* Gráfico de Estados */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                  width: "100%",
                }}
              >
                <Typography variant="h6" gutterBottom align="center">
                  Estado de Clases
                </Typography>
                <PieChart
                  series={[
                    {
                      data: data.graficoEstados,
                      innerRadius: 30,
                      paddingAngle: 2,
                      cornerRadius: 4,
                      highlightScope: { fade: "global", highlight: "item" },
                    },
                  ]}
                  height={250}
                  slotProps={{
                    legend: {
                      direction: "horizontal",
                      position: { vertical: "bottom", horizontal: "center" },
                    },
                  }}
                />
              </Paper>
            </Grid>

            {/* Gráfico de Origen */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                  width: "100%",
                }}
              >
                <Typography variant="h6" gutterBottom align="center">
                  Origen de Clases
                </Typography>
                <PieChart
                  series={[
                    {
                      data: [
                        {
                          label: "Sistema",
                          value: data.kpis.origen.sistema,
                          color: "#9c27b0",
                        },
                        {
                          label: "Docente",
                          value: data.kpis.origen.docente,
                          color: "#ff9800",
                        },
                      ],
                      innerRadius: 30,
                      paddingAngle: 2,
                      cornerRadius: 4,
                    },
                  ]}
                  height={250}
                  slotProps={{
                    legend: {
                      direction: "horizontal",
                      position: { vertical: "bottom", horizontal: "center" },
                    },
                  }}
                />
              </Paper>
            </Grid>

            {/* Stats Detalladas */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3} sx={{ height: "100%" }}>
                {/* Impacto en Resolución */}
                <ReportTextualCard
                  icon={<CheckCircleIcon />}
                  title="Impacto en Resolución"
                  value={`${data.impacto.porcentaje.toFixed(1)}%`}
                  description={
                    <>
                      El <b>{data.impacto.porcentaje.toFixed(1)}%</b> de las
                      consultas resueltas del curso fueron tratadas en una clase
                      de consulta.
                    </>
                  }
                  color="success"
                />

                {/* Top Docente */}
                <ReportTextualCard
                  icon={<SchoolIcon />}
                  title="Docente con más clases realizadas"
                  value={data.topTeacher.name}
                  description={
                    <>
                      Ha llevado a cabo un total de{" "}
                      <b>{data.topTeacher.count}</b> clases de consulta
                      realizadas.
                    </>
                  }
                  color="primary"
                />

                {/* Efectividad Sistema */}
                <ReportTextualCard
                  icon={<AutoAwesomeIcon />}
                  title="Efectividad Automática"
                  value={`${data.kpis.origen.pctSistemaRealizadas.toFixed(1)}%`}
                  description={
                    <>
                      De las clases generadas por el sistema, el{" "}
                      <b>{data.kpis.origen.pctSistemaRealizadas.toFixed(1)}%</b>{" "}
                      fueron efectivamente realizadas por un docente.
                    </>
                  }
                  color="secondary"
                />
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Paper>
  );
}
