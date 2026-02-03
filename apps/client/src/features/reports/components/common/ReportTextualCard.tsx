import { Paper, Stack, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";

interface ReportTextualCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  description: ReactNode;
  color: "primary" | "secondary" | "error" | "info" | "success" | "warning";
}

export default function ReportTextualCard({
  icon,
  title,
  value,
  description,
  color,
}: ReportTextualCardProps) {
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
      <Stack direction="column" spacing={0.5}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <Box sx={{ color: `${color}.main`, display: "flex" }}>{icon}</Box>
          <Typography
            variant="subtitle2"
            color="textSecondary"
            fontWeight="bold"
          >
            {title}
          </Typography>
        </Stack>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      </Stack>
    </Paper>
  );
}
