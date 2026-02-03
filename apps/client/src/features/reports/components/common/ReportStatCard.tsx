import { Paper, Stack, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";

interface ReportStatCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  count: number;
  percentage?: number;
  color: "primary" | "secondary" | "error" | "info" | "success" | "warning";
}

export default function ReportStatCard({
  icon,
  title,
  subtitle,
  count,
  percentage,
  color,
}: ReportStatCardProps) {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        height: "100%",
        borderLeft: "4px solid",
        borderColor: `${color}.main`,
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
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="baseline">
          <Typography variant="h4" color={`${color}.main`} fontWeight="bold">
            {count}
          </Typography>
          {percentage !== undefined && (
            <Typography variant="caption" color={`${color}.main`}>
              ({percentage.toFixed(1)}%)
            </Typography>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
