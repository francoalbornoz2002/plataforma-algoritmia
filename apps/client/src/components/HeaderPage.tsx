import { Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import CardIcon from "./CardIcon";

interface HeaderPageProps {
  title: string;
  description: string;
  icon: ReactNode;
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
}

export default function HeaderPage({
  title,
  description,
  icon,
  color = "primary",
}: HeaderPageProps) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <CardIcon icon={icon} color={color} size="large" />
        <Stack justifyContent="center">
          <Typography variant="h6" color={`${color}.main`} fontWeight="bold">
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
