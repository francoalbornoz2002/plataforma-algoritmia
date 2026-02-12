// apps/client/src/features/dashboards/components/DashboardTextCard.tsx
import { Paper, Stack, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";

interface DashboardTextCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  description?: string;
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
  small?: boolean;
  onClick?: () => void;
}

export default function DashboardTextCard({
  icon,
  title,
  value,
  description,
  color = "primary",
  small = false,
  onClick,
}: DashboardTextCardProps) {
  return (
    <Paper
      elevation={2}
      onClick={onClick}
      sx={{
        p: small ? 1.5 : 2,
        height: "100%",
        borderLeft: "4px solid",
        borderColor: `${color}.main`,
        transition: "transform 0.2s",
        cursor: onClick ? "pointer" : "default",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
        },
      }}
    >
      <Stack spacing={small ? 0.25 : 0.5}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              color: `${color}.main`,
              display: "flex",
              "& svg": { fontSize: small ? "1.2rem" : "1.5rem" },
            }}
          >
            {icon}
          </Box>
          <Typography
            variant={small ? "body2" : "subtitle2"}
            color="text.secondary"
            fontWeight="bold"
          >
            {title}
          </Typography>
        </Stack>
        {description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              lineHeight: 1.2,
              fontSize: small ? "0.7rem" : undefined,
            }}
          >
            {description}
          </Typography>
        )}
        <Typography variant={small ? "subtitle1" : "h6"} fontWeight="bold">
          {value}
        </Typography>
      </Stack>
    </Paper>
  );
}
