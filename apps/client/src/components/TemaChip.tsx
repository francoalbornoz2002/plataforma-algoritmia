import { Chip, type SxProps } from "@mui/material";
import { temas } from "../types";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered"; // Secuencia
import AccountTreeIcon from "@mui/icons-material/AccountTree"; // Logica
import LoopIcon from "@mui/icons-material/Loop"; // Estructuras
import DataObjectIcon from "@mui/icons-material/DataObject"; // Variables
import SubdirectoryArrowRightIcon from "@mui/icons-material/SubdirectoryArrowRight"; // Procedimientos
import BlockIcon from "@mui/icons-material/Block"; // Ninguno
import { TemasLabels } from "../types/traducciones";

interface TemaChipProps {
  tema: temas;
  small?: boolean;
  sx?: SxProps;
}

export default function TemaChip({ tema, small, sx }: TemaChipProps) {
  let icon: React.ReactElement;

  // Hacemos un switch para asignar el ícono correcto
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

  // Renderizamos el Chip
  return (
    <Chip
      icon={icon}
      label={TemasLabels[tema]}
      variant="outlined"
      size={small ? "small" : "medium"}
      sx={sx}
    />
  );
}
