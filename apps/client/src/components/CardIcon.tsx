import { Box } from "@mui/material";
import type { ReactNode } from "react";

interface CardIconProps {
  icon: ReactNode;
  color: string;
  size?: "small" | "medium" | "large" | "xl";
}

export default function CardIcon({
  icon,
  color,
  size = "medium",
}: CardIconProps) {
  return (
    <Box
      sx={{
        color: `${color}.main`,
        display: "flex",
        bgcolor: `${color}.50`,
        p: size === "xl" ? 1.5 : size === "large" ? 1 : 0.5,
        borderRadius: "20%",
        "& svg": {
          fontSize:
            size === "xl"
              ? "2.5em"
              : size === "large"
                ? "2em"
                : size === "small"
                  ? "1.2rem"
                  : "1.5rem",
        },
      }}
    >
      {icon}
    </Box>
  );
}
