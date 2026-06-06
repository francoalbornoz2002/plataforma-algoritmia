import {
  Paper,
  Stack,
  Avatar,
  Typography,
  Button,
  Divider,
} from "@mui/material";
import ProgressStat from "../../progress/components/ProgressStat";
import FunctionsIcon from "@mui/icons-material/Functions";
import DangerousIcon from "@mui/icons-material/Dangerous";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";

interface DifficultiesItemProps {
  student: {
    nombre: string;
    apellido: string;
    fotoPerfilUrl?: string | null;
  };
  stats: {
    total: number;
    alto: number;
    medio: number;
    bajo: number;
    ninguno: number;
  };
  onDetailClick: () => void;
}

export default function DifficultiesItem({
  student,
  stats,
  onDetailClick,
}: DifficultiesItemProps) {
  const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX || "";

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
          sx={{ minWidth: { md: 220 } }}
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
            icon={<FunctionsIcon />}
            color="primary"
            label="Total Dif."
            value={stats.total}
            placeholderValue="99"
          />

          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", sm: "block" } }}
          />

          <ProgressStat
            icon={<DangerousIcon />}
            color="error"
            label="G. Alto"
            value={stats.alto}
            placeholderValue="99"
          />

          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", sm: "block" } }}
          />

          <ProgressStat
            icon={<WarningIcon />}
            color="warning"
            label="G. Medio"
            value={stats.medio}
            placeholderValue="99"
          />

          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", sm: "block" } }}
          />

          <ProgressStat
            icon={<CheckCircleIcon />}
            color="success"
            label="G. Bajo"
            value={stats.bajo}
            placeholderValue="99"
          />

          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", sm: "block" } }}
          />

          <ProgressStat
            icon={<RemoveCircleIcon />}
            color="info"
            label="Superadas"
            value={stats.ninguno}
            placeholderValue="99"
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
