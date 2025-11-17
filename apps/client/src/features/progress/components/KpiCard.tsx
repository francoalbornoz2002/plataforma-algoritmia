// src/components/KpiCard.tsx (o donde lo tengas)

import {
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Chip,
  type ChipProps, // Para tipar el color
} from "@mui/material";

// Importamos los íconos que usaremos
import StarIcon from "@mui/icons-material/Star";
import BoltIcon from "@mui/icons-material/Bolt";
import ReplayIcon from "@mui/icons-material/Replay";
import PercentIcon from "@mui/icons-material/Percent"; // Para Progreso
import TaskAltIcon from "@mui/icons-material/TaskAlt"; // Para Misiones

interface KpiCardProps {
  title: string;
  value: string | number;
  loading: boolean;
}

export default function KpiCard({ title, value, loading }: KpiCardProps) {
  /**
   * Esta función decide cómo renderizar el valor.
   * 1. Si está cargando, muestra un spinner.
   * 2. Si el 'title' coincide con un KPI conocido, muestra un Chip.
   * 3. Si no, muestra el valor como texto plano (ej: "Última Actividad").
   */
  const renderValue = () => {
    if (loading) {
      return <CircularProgress size={30} />;
    }

    let chipIcon: React.ReactElement | undefined = undefined;
    let chipColor: ChipProps["color"] = "default";
    let useChip = false;

    // --- Lógica para decidir el estilo del Chip basado en el TÍTULO ---
    if (title.includes("Estrellas")) {
      chipIcon = <StarIcon />;
      chipColor = "warning";
      useChip = true;
    } else if (title.includes("EXP")) {
      chipIcon = <BoltIcon />;
      chipColor = "primary";
      useChip = true;
    } else if (title.includes("Intentos")) {
      chipIcon = <ReplayIcon />;
      chipColor = "default";
      useChip = true;
    } else if (title.includes("Progreso")) {
      chipIcon = <PercentIcon />;
      chipColor = "success"; // Buen color para progreso
      useChip = true;
    } else if (title.includes("Misiones")) {
      chipIcon = <TaskAltIcon />;
      chipColor = "info";
      useChip = true;
    }
    // --- Fin de la lógica ---

    if (useChip) {
      return (
        <Chip
          icon={chipIcon}
          label={value} // El 'value' ya viene formateado (ej: "⭐ 2.5" o "75.0%")
          color={chipColor}
          variant="outlined"
          // Al no poner 'size', usa "medium" (normal) por defecto
        />
      );
    }

    // Caso por defecto (ej: "Última Actividad")
    // Lo renderizamos directamente
    return <>{value}</>;
  };

  return (
    <Card>
      <CardContent sx={{ textAlign: "center" }}>
        <Typography variant="subtitle2" color="text.primary" gutterBottom>
          {title}
        </Typography>

        {/* Este Typography ahora envuelve el valor.
          Le damos estilos para centrar el Chip y evitar saltos de altura 
          cuando los datos están cargando.
        */}
        <Typography
          variant="h5" // Mantenemos la tipografía
          component="div"
          sx={{
            minHeight: 40, // Evita que la Card cambie de altura al cargar
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {renderValue()}
        </Typography>
      </CardContent>
    </Card>
  );
}
