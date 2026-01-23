import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { getCourseProgressSummary } from "../service/reports.service";

interface Props {
  courseId: string;
}

export default function CourseProgressSummary({ courseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getCourseProgressSummary(courseId);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el resumen de progreso.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  const { resumen, grafico } = data;

  return (
    <Paper elevation={5} component="section" sx={{ p: 2 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ mb: 3, fontWeight: "bold", color: "primary.main" }}
      >
        Resumen de Progreso del Curso
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        {/* KPIs */}
        <Box sx={{ flex: 1 }}>
          <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Progreso Total del Curso
                </Typography>
                <Typography variant="h3" color="primary.main" fontWeight="bold">
                  {resumen.progresoTotal.toFixed(1)}%
                </Typography>
              </Box>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" display="block">
                    Misiones Completadas
                  </Typography>
                  <Typography variant="h6">
                    {resumen.misionesCompletadas}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" display="block">
                    Alumnos Activos
                  </Typography>
                  <Typography variant="h6">{resumen.totalAlumnos}</Typography>
                </Box>
              </Stack>
              <Divider />
              <Stack direction="row" spacing={4}>
                <Box>
                  <Typography variant="caption" display="block">
                    Estrellas Totales
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {resumen.estrellasTotales}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" display="block">
                    Exp Total
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {resumen.expTotal}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" display="block">
                    Intentos Totales
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {resumen.intentosTotales}
                  </Typography>
                </Box>
              </Stack>
              <Divider />
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Promedios por Alumno
                </Typography>
                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="caption">Estrellas</Typography>
                    <Typography variant="h6" color="warning.main">
                      {resumen.promEstrellas.toFixed(1)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption">Intentos</Typography>
                    <Typography variant="h6" color="info.main">
                      {resumen.promIntentos.toFixed(1)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Box>

        {/* Gráfico */}
        <Box sx={{ flex: 1, minHeight: 300 }}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Estado Global
            </Typography>
            <PieChart
              series={[
                {
                  data: grafico,
                  highlightScope: { fade: "global", highlight: "item" },
                  faded: {
                    innerRadius: 30,
                    additionalRadius: -30,
                    color: "gray",
                  },
                },
              ]}
              height={250}
              width={400}
              slotProps={{
                legend: {
                  direction: "horizontal",
                  position: { vertical: "bottom", horizontal: "center" },
                },
              }}
            />
          </Paper>
        </Box>
      </Stack>
    </Paper>
  );
}
