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

const CONFIG: Record<string, React.ReactElement> = {
  [temas.Secuencia]: <FormatListNumberedIcon sx={{ fontSize: "1.25rem" }} />,
  [temas.Logica]: <AccountTreeIcon sx={{ fontSize: "1.25rem" }} />,
  [temas.Estructuras]: <LoopIcon sx={{ fontSize: "1.25rem" }} />,
  [temas.Variables]: <DataObjectIcon sx={{ fontSize: "1.25rem" }} />,
  [temas.Procedimientos]: (
    <SubdirectoryArrowRightIcon sx={{ fontSize: "1.25rem" }} />
  ),
  [temas.Ninguno]: <BlockIcon sx={{ fontSize: "1.25rem" }} />,
};

export default function TemaChip({ tema, small, sx }: TemaChipProps) {
  const icon = CONFIG[tema] || <BlockIcon sx={{ fontSize: "1.25rem" }} />;

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
