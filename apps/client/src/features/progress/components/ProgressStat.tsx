import { Stack, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";
import CardIcon from "../../../components/CardIcon";

interface ProgressStatProps {
  icon: ReactNode;
  color: string;
  label: string;
  value: ReactNode;
  subValue?: ReactNode;
  placeholderValue?: string;
  placeholderSubValue?: string;
}

export default function ProgressStat({
  icon,
  color,
  label,
  value,
  subValue,
  placeholderValue,
  placeholderSubValue,
}: ProgressStatProps) {
  const textColor = color === "grey" ? "grey.600" : `${color}.main`;

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <CardIcon icon={icon} color={color} size="medium" />
      <Stack justifyContent="center">
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Box sx={{ display: "grid" }}>
          {/* Contenedor invisible que asegura un ancho mínimo basado en el texto más largo */}
          <Stack
            direction="row"
            alignItems="baseline"
            spacing={0.5}
            sx={{ gridArea: "1 / 1", visibility: "hidden" }}
          >
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{ lineHeight: 1 }}
            >
              {placeholderValue ?? value}
            </Typography>
            {(placeholderSubValue || subValue) && (
              <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                {placeholderSubValue ?? subValue}
              </Typography>
            )}
          </Stack>

          {/* Contenedor real superpuesto perfectamente */}
          <Stack
            direction="row"
            alignItems="baseline"
            spacing={0.5}
            sx={{ gridArea: "1 / 1" }}
          >
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              color={textColor}
              sx={{ lineHeight: 1 }}
            >
              {value}
            </Typography>
            {subValue && (
              <Typography
                variant="caption"
                color={textColor}
                sx={{ fontSize: "0.75rem" }}
              >
                {subValue}
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
}
