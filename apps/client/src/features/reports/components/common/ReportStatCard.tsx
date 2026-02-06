import { Paper, Stack, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";

interface ReportStatCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  count: number | string;
  percentage?: number;
  color: "primary" | "secondary" | "error" | "info" | "success" | "warning";
  small?: boolean;
}

export default function ReportStatCard({
  icon,
  title,
  subtitle,
  count,
  percentage,
  color,
  small = false,
}: ReportStatCardProps) {
  return (
    <Paper
      elevation={3}
      sx={{
        p: small ? 1.5 : 2,
        height: "100%",
        borderLeft: "4px solid",
        borderColor: `${color}.main`,
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
            sx={{ lineHeight: 1.2 }}
          >
            {title}
          </Typography>
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
        <Stack direction="row" spacing={1} alignItems="baseline">
          <Typography
            variant={small ? "h5" : "h4"}
            color={`${color}.main`}
            fontWeight="bold"
          >
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
