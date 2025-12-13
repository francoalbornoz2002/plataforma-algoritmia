import {
  Box,
  Typography,
  Stack,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";

import {
  type SesionRefuerzoConDetalles,
  grado_dificultad,
} from "../../../types";
import GradeChip from "../../../components/GradeChip";

interface ResultadoSesionViewProps {
  sesion: SesionRefuerzoConDetalles;
  nuevoGrado?: grado_dificultad | null;
}

export default function ResultadoSesionView({
  sesion,
  nuevoGrado,
}: ResultadoSesionViewProps) {
  if (!sesion.resultadoSesion) {
    return <Typography>Esta sesión aún no tiene resultados.</Typography>;
  }

  const {
    cantCorrectas,
    cantIncorrectas,
    pctAciertos,
    respuestasAlumno,
    gradoAnterior,
    gradoNuevo,
  } = sesion.resultadoSesion;

  const respuestasMap = new Map(
    (respuestasAlumno || []).map((r) => [r.idPregunta, r.idOpcionElegida])
  );

  const renderGradoChange = () => {
    if (!gradoNuevo) return null;

    const grados = [
      grado_dificultad.Bajo,
      grado_dificultad.Medio,
      grado_dificultad.Alto,
    ];
    const indexAntes = grados.indexOf(gradoAnterior);
    const indexDespues = grados.indexOf(gradoNuevo);

    let Icon = HorizontalRuleIcon;
    let color = "text.secondary";
    let text = "Tu grado se mantiene.";

    if (gradoNuevo === grado_dificultad.Ninguno) {
      Icon = CheckCircleIcon;
      color = "success.main";
      text = "¡Superaste esta dificultad!";
    } else if (indexDespues > indexAntes) {
      Icon = ArrowUpwardIcon;
      color = "error.main";
      text = "Tu grado de dificultad aumentó.";
    } else if (indexDespues < indexAntes) {
      Icon = ArrowDownwardIcon;
      color = "success.main";
      text = "Tu grado de dificultad disminuyó.";
    }

    return (
      <Stack direction="row" alignItems="center" spacing={1} sx={{ color }}>
        <Icon fontSize="small" />
        <Typography variant="body2" fontWeight="bold">
          {text}
        </Typography>
      </Stack>
    );
  };

  return (
    <Stack spacing={3}>
      {/* --- Resumen de Estadísticas --- */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Resumen de la Sesión
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          divider={<Divider orientation="vertical" flexItem />}
          justifyContent="space-around"
        >
          <Box textAlign="center">
            <Typography variant="h4" color="primary">
              {cantCorrectas}
            </Typography>
            <Typography variant="subtitle2">Correctas</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4" color="error">
              {cantIncorrectas}
            </Typography>
            <Typography variant="subtitle2">Incorrectas</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4" color="text.primary">
              {Math.round(Number(pctAciertos))}%
            </Typography>
            <Typography variant="subtitle2">Aciertos</Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="body2">
              Dificultad: <strong>{sesion.dificultad.nombre}</strong>
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2">Grado anterior:</Typography>
              <GradeChip grado={gradoAnterior} small />
              {gradoNuevo && (
                <>
                  <Typography variant="body2">Grado nuevo:</Typography>
                  <GradeChip grado={gradoNuevo} small />
                </>
              )}
            </Stack>
          </Box>
          {renderGradoChange()}
        </Stack>
      </Paper>

      {/* --- Detalle de Preguntas --- */}
      <Typography variant="h6">Detalle de Respuestas</Typography>
      <Stack spacing={2}>
        {sesion.preguntas.map(({ pregunta }, index) => {
          const opcionElegidaId = respuestasMap.get(pregunta.id);
          const opcionCorrecta = pregunta.opcionesRespuesta.find(
            (o) => o.esCorrecta
          );
          const esCorrectaLaElegida = opcionElegidaId === opcionCorrecta?.id;

          return (
            <Paper key={pregunta.id} variant="outlined" sx={{ p: 2 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                spacing={2}
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle1">
                  <strong>Pregunta {index + 1}:</strong> {pregunta.enunciado}
                </Typography>
                <Chip
                  label={esCorrectaLaElegida ? "¡Correcta!" : "¡Incorrecta!"}
                  color={esCorrectaLaElegida ? "success" : "error"}
                  size="small"
                  variant={esCorrectaLaElegida ? "filled" : "outlined"}
                />
              </Stack>

              <List dense>
                {pregunta.opcionesRespuesta.map((opcion) => {
                  const esLaCorrecta = opcion.esCorrecta;
                  const esLaElegida = opcion.id === opcionElegidaId;

                  let icon = <RadioButtonUncheckedIcon color="disabled" />;
                  let primaryTextSx: any = {};
                  let secondaryText: React.ReactNode = null;

                  if (esLaCorrecta) {
                    icon = <CheckCircleIcon color="success" />;
                    if (esLaElegida) {
                      // El alumno eligió la correcta
                      primaryTextSx = { fontWeight: "bold" };
                      secondaryText = (
                        <Typography
                          variant="caption"
                          color="success.main"
                          fontWeight="bold"
                        >
                          Tu respuesta (Correcta)
                        </Typography>
                      );
                    } else {
                      // Esta es la correcta, pero el alumno eligió otra
                      secondaryText = (
                        <Typography variant="caption" color="success.main">
                          Respuesta correcta
                        </Typography>
                      );
                    }
                  } else if (esLaElegida) {
                    // esLaCorrecta es false, pero el alumno la eligió
                    icon = <CancelIcon color="error" />;
                    primaryTextSx = {
                      fontWeight: "bold",
                      textDecoration: "line-through",
                    };
                    secondaryText = (
                      <Typography
                        variant="caption"
                        color="error.main"
                        fontWeight="bold"
                      >
                        Tu respuesta (Incorrecta)
                      </Typography>
                    );
                  }

                  return (
                    <ListItem key={opcion.id} alignItems="flex-start">
                      <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                        {icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={opcion.textoOpcion}
                        secondary={secondaryText}
                        primaryTypographyProps={{ sx: primaryTextSx }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          );
        })}
      </Stack>
    </Stack>
  );
}
