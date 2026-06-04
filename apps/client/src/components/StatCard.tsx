import { Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import CardIcon from "./CardIcon";

interface StatCardProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  value: ReactNode;
  percentage?: number;
  color: string;
  small?: boolean;
  onClick?: () => void;
}

export default function StatCard({
  icon,
  title,
  description,
  value,
  percentage,
  color,
  small = false,
  onClick,
}: StatCardProps) {
  return (
    <Paper
      onClick={onClick}
      sx={{
        p: small ? 1.5 : 2,
        height: "100%",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <Stack spacing={small ? 0.5 : 1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CardIcon
            icon={icon}
            color={color}
            size={small ? "small" : "medium"}
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
            variant={small ? "h6" : "h5"}
            color={`${color}.main`}
            fontWeight="bold"
          >
            {value}
          </Typography>
          {percentage !== undefined && (
            <Typography variant="caption" color={`${color}.main`}>
              ({percentage.toFixed(1)}%)
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
