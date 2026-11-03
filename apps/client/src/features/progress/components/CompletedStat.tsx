import { Stack, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";
import CardIcon from "../../../components/CardIcon";

interface CompletedStatProps {
  icon: ReactNode;
  color: string;
  label: string;
  value: ReactNode;
}

export default function CompletedStat({
  icon,
  color,
  label,
  value,
}: CompletedStatProps) {
  const textColor = color === "grey" ? "grey.600" : `${color}.main`;

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <CardIcon icon={icon} color={color} size="medium" />
      <Stack justifyContent="center">
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="subtitle2"
          fontWeight="bold"
          color={textColor}
          sx={{ lineHeight: 1 }}
        >
          {value}
        </Typography>
      </Stack>
    </Stack>
  );
}
