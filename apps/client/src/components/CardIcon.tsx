import { Box } from "@mui/material";
import type { ReactNode } from "react";

interface CardIconProps {
  icon: ReactNode;
  color: string;
  small?: boolean;
  large?: boolean;
}

export default function CardIcon({ icon, color, small, large }: CardIconProps) {
  return (
    <Box
      sx={{
        color: `${color}.main`,
        display: "flex",
        bgcolor: `${color}.50`,
        p: 0.5,
        borderRadius: "15%",
        "& svg": { fontSize: large ? "2.5em" : small ? "1.2rem" : "1.5rem" },
      }}
    >
      {icon}
    </Box>
  );
}
