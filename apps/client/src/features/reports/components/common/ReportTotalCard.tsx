import { Paper, Stack, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";

interface ReportTotalCardProps {
  resourceName: string;
  total: number;
  active: number;
  inactive: number;
  icon?: ReactNode;
}

export default function ReportTotalCard({
  resourceName,
  total,
  active,
  inactive,
  icon,
}: ReportTotalCardProps) {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        height: "100%",
        borderLeft: "4px solid",
        borderColor: "primary.main",
      }}
    >
      <Stack spacing={0.5} justifyContent="center">
        <Stack direction="row" alignItems="center" spacing={1}>
          {icon && (
            <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
          )}
          <Typography variant="subtitle2" color="text.secondary">
            Total {resourceName}
          </Typography>
        </Stack>

        <Typography variant="h4" color="primary.main" fontWeight="bold">
          {total}
        </Typography>
        <Stack direction="row" spacing={2}>
          <Typography
            variant="caption"
            display="block"
            color="success.main"
            fontWeight="bold"
          >
            Activas: {active}
          </Typography>
          <Typography variant="caption" display="block" color="text.disabled">
            Inactivas: {inactive}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
