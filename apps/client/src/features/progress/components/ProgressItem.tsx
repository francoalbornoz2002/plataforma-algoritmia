import {
  Paper,
  Stack,
  Avatar,
  Typography,
  Button,
  Divider,
} from "@mui/material";
import ProgressStat from "./ProgressStat";
import StarIcon from "@mui/icons-material/Star";
import BoltIcon from "@mui/icons-material/Bolt";
import ReplayIcon from "@mui/icons-material/Replay";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ProgressItemProps {
  student: {
    nombre: string;
    apellido: string;
    fotoPerfilUrl?: string | null;
  };
  stats: {
    cantMisionesCompletadas: number;
    progresoPct: number;
    totalEstrellas: number;
    promEstrellas: number;
    totalIntentos: number;
    promIntentos: number;
    totalExp: number;
    ultimaActividad: string | null;
  };
  onDetailClick: () => void;
}

export default function ProgressItem({
  student,
  stats,
  onDetailClick,
}: ProgressItemProps) {
  const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX || "";

  const ultimaActividadFormateada = stats.ultimaActividad
    ? formatDistanceToNow(new Date(stats.ultimaActividad), {
        locale: es,
        addSuffix: true,
      })
    : "Nunca";

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: "0.7em" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
      >
        {/* Lado Izquierdo: Avatar y Nombre */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ minWidth: { xl: 220 } }}
        >
          <Avatar
            src={
              student.fotoPerfilUrl
                ? `${baseUrl}${student.fotoPerfilUrl}`
                : undefined
            }
            sx={{ width: 48, height: 48, bgcolor: "primary.main" }}
          >
            {student.apellido[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="subtitle1" fontWeight="bold">
            {student.apellido}, {student.nombre}
          </Typography>
        </Stack>

        {/* Lado Derecho: Estadísticas y Acción */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={{ xs: 2, md: 2 }}
          flexWrap="wrap"
          useFlexGap
        >
          <ProgressStat
            icon={<TaskAltIcon />}
            color="success"
            label="Misiones compl."
            value={stats.cantMisionesCompletadas}
            subValue={`(${stats.progresoPct.toFixed(1)}% prog.)`}
            placeholderValue="999"
            placeholderSubValue="(100.0% prog.)"
          />

          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", sm: "block" } }}
          />

          <ProgressStat
            icon={<StarIcon />}
            color="warning"
            label="Estrellas"
            value={stats.totalEstrellas}
            subValue={`(${stats.promEstrellas.toFixed(1)} prom.)`}
            placeholderValue="999"
            placeholderSubValue="(99.9 prom.)"
          />

          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", sm: "block" } }}
          />

          <ProgressStat
            icon={<ReplayIcon />}
            color="primary"
            label="Intentos"
            value={stats.totalIntentos}
            subValue={`(${stats.promIntentos.toFixed(1)} prom.)`}
            placeholderValue="999"
            placeholderSubValue="(99.9 prom.)"
          />

          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", sm: "block" } }}
          />

          <ProgressStat
            icon={<BoltIcon />}
            color="secondary"
            label="Experiencia"
            value={stats.totalExp}
            subValue="Pts."
            placeholderValue="99999"
            placeholderSubValue="Pts."
          />

          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", sm: "block" } }}
          />

          <ProgressStat
            icon={<AccessTimeIcon />}
            color="info"
            label="Última Act."
            value={ultimaActividadFormateada}
            placeholderValue="hace 11 meses"
          />

          <Button
            variant="outlined"
            size="small"
            onClick={onDetailClick}
            sx={{ ml: { xs: 0, md: 1 } }}
          >
            Detalle
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
