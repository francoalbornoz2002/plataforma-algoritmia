import { Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import CardIcon from "../../../components/CardIcon";

interface ProgressStatProps {
  icon: ReactNode;
  color: string;
  label: string;
  value: ReactNode;
  subValue?: ReactNode;
}

export default function ProgressStat({
  icon,
  color,
  label,
  value,
  subValue,
}: ProgressStatProps) {
  const textColor = color === "grey" ? "grey.600" : `${color}.main`;

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <CardIcon icon={icon} color={color} size="medium" />
      <Stack justifyContent="center">
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Stack direction="row" alignItems="baseline" spacing={0.5}>
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
      </Stack>
    </Stack>
  );
}
