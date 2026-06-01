import { Paper, Stack, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";
import CardIcon from "./CardIcon";

interface StatCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  value: number | string;
  percentage?: number;
  color: string;
  small?: boolean;
}

export default function StatCard({
  icon,
  title,
  subtitle,
  value,
  percentage,
  color,
  small = false,
}: StatCardProps) {
  return (
    <Paper
      sx={{
        p: small ? 1.5 : 2,
        height: "100%",
      }}
    >
      <Stack spacing={small ? 0.25 : 0.5}>
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
            variant={small ? "h5" : "h4"}
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
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontSize: small ? "0.7rem" : undefined,
            lineHeight: small ? 1.2 : undefined,
          }}
        >
          {subtitle}
        </Typography>
      </Stack>
    </Paper>
  );
}
