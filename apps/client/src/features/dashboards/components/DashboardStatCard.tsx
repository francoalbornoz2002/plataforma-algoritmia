// apps/client/src/features/dashboards/components/DashboardStatCard.tsx
import { Paper, Stack, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";

interface DashboardStatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
  small?: boolean;
  week?: boolean;
}

export default function DashboardStatCard({
  icon,
  title,
  value,
  subtitle,
  color = "primary",
  small = false,
  week = false,
}: DashboardStatCardProps) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: small ? 1.5 : 2,
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
        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              lineHeight: 1.2,
              fontSize: small ? "0.7rem" : undefined,
            }}
          >
            {subtitle}
          </Typography>
        )}

        {week && typeof value === "string" && value.includes(" / ") ? (
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
            <Typography
              variant={small ? "h6" : "h5"}
              fontWeight="bold"
              color={`${color}.main`}
            >
              {value.split(" / ")[0]}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="medium"
            >
              hoy
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mx: 0.2 }}>
              /
            </Typography>
            <Typography variant={small ? "subtitle1" : "h6"} fontWeight="bold">
              {value.split(" / ")[1]}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="medium"
            >
              sem.
            </Typography>
          </Box>
        ) : (
          <Typography
            variant={small ? "h6" : "h5"}
            fontWeight="bold"
            color={`${color}.main`}
          >
            {value}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
