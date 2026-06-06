import { Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import CardIcon from "./CardIcon";

interface StatCardProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  value: ReactNode;
  subValue?: number | string;
  color: string;
  small?: boolean;
  mode?: "text" | "numeric";
  onClick?: () => void;
}

export default function StatCard({
  icon,
  title,
  description,
  value,
  subValue,
  color,
  small = false,
  mode = "numeric",
  onClick,
}: StatCardProps) {
  const textColor = color === "grey" ? "grey.600" : `${color}.main`;

  return (
    <Paper
      onClick={onClick}
      sx={{
        p: small ? 1.5 : 2,
        height: "100%",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <Stack spacing={small ? 0.25 : 0.5}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CardIcon
            icon={icon}
            color={color}
            size={small ? "small" : "small"}
          />
          <Typography
            variant={small ? "body2" : "subtitle2"}
            sx={{ lineHeight: 1.2 }}
          >
            {title}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="baseline">
          <Typography
            variant={
              mode === "text"
                ? small
                  ? "subtitle1"
                  : "h6"
                : small
                  ? "h6"
                  : "h5"
            }
            color={textColor}
            fontWeight="bold"
          >
            {value}
          </Typography>
          {subValue !== undefined && (
            <Typography variant="caption" color={textColor}>
              {typeof subValue === "number"
                ? `(${subValue.toFixed(1)}%)`
                : subValue}
            </Typography>
          )}
        </Stack>
        {description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: small ? "0.7rem" : undefined,
              lineHeight: small ? 1.2 : undefined,
            }}
          >
            {description}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
