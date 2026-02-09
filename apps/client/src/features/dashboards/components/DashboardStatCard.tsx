// apps/client/src/features/dashboards/components/DashboardStatCard.tsx
import { Paper, Stack, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";

interface DashboardStatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
}

export default function DashboardStatCard({
  icon,
  title,
  value,
  subtitle,
  color = "primary",
}: DashboardStatCardProps) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        height: "100%",
        borderLeft: "4px solid",
        borderColor: `${color}.main`,
        transition: "transform 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
        },
      }}
    >
      <Stack spacing={0.5}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ color: `${color}.main`, display: "flex" }}>{icon}</Box>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            fontWeight="bold"
          >
            {title}
          </Typography>
        </Stack>
        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ lineHeight: 1.2 }}
          >
            {subtitle}
          </Typography>
        )}
        <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
          {value}
        </Typography>
      </Stack>
    </Paper>
  );
}
