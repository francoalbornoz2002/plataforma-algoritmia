import { Chip } from "@mui/material";
import { temas } from "../types"; // Ajusta la ruta a 'types'

// 1. Importamos los íconos para cada tema
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered"; // Secuencia
import AccountTreeIcon from "@mui/icons-material/AccountTree"; // Logica
import LoopIcon from "@mui/icons-material/Loop"; // Estructuras
import DataObjectIcon from "@mui/icons-material/DataObject"; // Variables
import SubdirectoryArrowRightIcon from "@mui/icons-material/SubdirectoryArrowRight"; // Procedimientos
import BlockIcon from "@mui/icons-material/Block"; // Ninguno

interface TemaChipProps {
  tema: temas;
}

export default function TemaChip({ tema }: TemaChipProps) {
  let icon: React.ReactElement;

  // 2. Hacemos un switch para asignar el ícono correcto
  switch (tema) {
    case temas.Secuencia:
      icon = <FormatListNumberedIcon sx={{ fontSize: "1.25rem" }} />;
      break;
    case temas.Logica:
      icon = <AccountTreeIcon sx={{ fontSize: "1.25rem" }} />;
      break;
    case temas.Estructuras:
      icon = <LoopIcon sx={{ fontSize: "1.25rem" }} />;
      break;
    case temas.Variables:
      icon = <DataObjectIcon sx={{ fontSize: "1.25rem" }} />;
      break;
    case temas.Procedimientos:
      icon = <SubdirectoryArrowRightIcon sx={{ fontSize: "1.25rem" }} />;
      break;
    case temas.Ninguno:
    default:
      icon = <BlockIcon sx={{ fontSize: "1.25rem" }} />;
      break;
  }

  // 3. Renderizamos el Chip
  return <Chip icon={icon} label={tema} variant="outlined" />;
}
