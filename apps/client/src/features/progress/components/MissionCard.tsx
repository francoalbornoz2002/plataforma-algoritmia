import { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Chip,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";

// Íconos
import StarIcon from "@mui/icons-material/Star"; // Estrellas
import BoltIcon from "@mui/icons-material/Bolt"; // EXP
import ReplayIcon from "@mui/icons-material/Replay"; // Intentos
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"; // Completada
import LockIcon from "@mui/icons-material/Lock"; // Pendiente
import CodeIcon from "@mui/icons-material/Code"; // Ver solución
import CloseIcon from "@mui/icons-material/Close";
import { Event } from "@mui/icons-material";
import { format } from "date-fns/format";

import type {
  MisionCompletada,
  MisionConEstado,
  MisionEspecial,
} from "../../../types";
import MissionDifficultyChip from "../../../components/MissionDifficultyChip";
import CompletedStat from "./CompletedStat";

type MissionItem = MisionConEstado | MisionCompletada | MisionEspecial;

interface MissionCardProps {
  missionData: MissionItem;
  hideStatus?: boolean;
}

// --- Helper para mostrar los Stats si está completada (1 sola fila) ---
function CompletedStats({ data }: { data: MisionCompletada | MisionEspecial }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
      <CompletedStat
        icon={<StarIcon />}
        color="warning"
        label="ESTRELLAS"
        value={data.estrellas}
      />
      <CompletedStat
        icon={<BoltIcon />}
        color="secondary"
        label={"EXP"}
        value={data.exp}
      />
      <CompletedStat
        icon={<ReplayIcon />}
        color="primary"
        label={"INTENTOS"}
        value={data.intentos}
      />
      <CompletedStat
        icon={<Event />}
        color="info"
        label="FECHA"
        value={
          data.fechaCompletado
            ? format(new Date(data.fechaCompletado), "dd/MM/yy")
            : "N/A"
        }
      />
    </Stack>
  );
}

// --- Componente Principal ---
export default function MissionCard({
  missionData,
  hideStatus = false,
}: MissionCardProps) {
  const [openModal, setOpenModal] = useState(false);

  // LÓGICA DE NORMALIZACIÓN
  let nombre = "";
  let descripcion = "";
  let dificultad = null;
  let numero: number | undefined;
  let completedData: MisionCompletada | MisionEspecial | null = null;
  let isSpecial = false;

  // CASO A: MisionEspecial (Tiene 'nombre' en la raíz y NO tiene 'mision')
  if ("nombre" in missionData && !("mision" in missionData)) {
    const m = missionData as MisionEspecial;
    nombre = m.nombre;
    descripcion = m.descripcion;
    completedData = m;
    isSpecial = true;
  }
  // CASO B: MisionConEstado (Tiene objeto 'mision' y propiedad 'completada')
  else if ("mision" in missionData && "completada" in missionData) {
    const m = missionData as MisionConEstado;
    nombre = m.mision.nombre;
    descripcion = m.mision.descripcion;
    dificultad = m.mision.dificultadMision;
    numero = m.mision.numero;
    completedData = m.completada;
  }
  // CASO C: MisionCompletada (Tiene objeto 'mision' y stats en la raíz)
  else if ("mision" in missionData) {
    const m = missionData as MisionCompletada;
    nombre = m.mision.nombre;
    descripcion = m.mision.descripcion;
    dificultad = m.mision.dificultadMision;
    numero = m.mision.numero;
    completedData = m;
  }

  const isCompleted = completedData !== null;

  return (
    <>
      <Card
        variant="elevation"
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 2,
          position: "relative",
        }}
      >
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          {/* Top Bar: Número de Misión y Estado (Completada o Pendiente) */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
            }}
          >
            {numero !== undefined ? (
              <Chip
                label={`Misión #${String(numero).padStart(2, "0")}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: "bold" }}
              />
            ) : isSpecial ? (
              <Chip
                label="Misión Especial"
                size="small"
                color="secondary"
                sx={{ fontWeight: "bold" }}
              />
            ) : (
              <Box />
            )}

            {!hideStatus &&
              (isCompleted ? (
                <Chip
                  icon={<CheckCircleOutlineIcon />}
                  label="Completada"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: "bold" }}
                />
              ) : (
                <Chip
                  icon={<LockIcon />}
                  label="Pendiente"
                  size="small"
                  color="default"
                  variant="outlined"
                  sx={{ fontWeight: "bold" }}
                />
              ))}
          </Box>

          {/* Título de la misión */}
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 600,
              fontSize: "1.1rem",
              lineHeight: 1.3,
              mb: 0.5,
            }}
          >
            {nombre}
          </Typography>

          {/* Dificultad (si existe) */}
          {dificultad && (
            <Box sx={{ mb: 1.5 }}>
              <MissionDifficultyChip dif={dificultad} />
            </Box>
          )}

          {/* Descripción limitada a 4 líneas con opción de 'ver más' */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              align="justify"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.5,
              }}
            >
              {descripcion}
            </Typography>
            <Button
              size="small"
              disableRipple
              onClick={() => setOpenModal(true)}
              sx={{
                p: 0,
                minWidth: "auto",
                textTransform: "none",
                "&.MuiButton-root:hover": {
                  backgroundColor: "transparent", // O el color base que desees
                  color: "inherit",
                },
              }}
            >
              ver más
            </Button>
          </Box>

          {/* Estadísticas de completado (una sola fila) */}
          {!hideStatus && isCompleted && (
            <CompletedStats data={completedData!} />
          )}
        </CardContent>

        {/* Footer: Botón de Ver Solución */}
        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<CodeIcon />}
            disabled={!isCompleted}
            onClick={() => {
              // Preparado para futura implementación de soluciones
            }}
          >
            Ver Solución
          </Button>
        </CardActions>
      </Card>

      {/* Modal 'Ver más': Solo Título y Descripción completa */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pr: 2,
          }}
        >
          <Typography variant="h6" component="span" fontWeight="bold">
            {nombre}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setOpenModal(false)}
            aria-label="Cerrar"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
            {descripcion}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
