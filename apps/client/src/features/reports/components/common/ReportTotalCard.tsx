import { Paper, Stack, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";

interface ReportTotalCardProps {
  resourceName: string;
  total: number | string;
  active?: number;
  inactive?: number;
  icon?: ReactNode;
  small?: boolean;
  activeLabelPrefix?: string;
}

export default function ReportTotalCard({
  resourceName,
  total,
  active,
  inactive,
  icon,
  small = false,
  activeLabelPrefix,
}: ReportTotalCardProps) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: small ? 1.5 : 2,
        height: "100%",
        borderLeft: "4px solid",
        borderColor: "primary.main",
      }}
    >
      <Stack spacing={small ? 0.25 : 0.5} justifyContent="center">
        <Stack direction="row" alignItems="center" spacing={1}>
          {icon && (
            <Box
              sx={{
                color: "primary.main",
                display: "flex",
                "& svg": { fontSize: small ? "1.2rem" : "1.5rem" },
              }}
            >
              {icon}
            </Box>
          )}
          <Typography
            variant={small ? "body2" : "subtitle2"}
            color="text.secondary"
            fontWeight="bold"
            sx={{ lineHeight: 1.2 }}
          >
            {resourceName}
          </Typography>
        </Stack>

        <Typography
          variant={small ? "h5" : "h4"}
          color="primary.main"
          fontWeight="bold"
        >
          {total}
        </Typography>
        {(active !== undefined || inactive !== undefined) && (
          <Stack direction="row" spacing={2}>
            {active !== undefined && (
              <Typography
                variant="caption"
                display="block"
                color="success.main"
                fontWeight="bold"
                sx={{ fontSize: small ? "0.7rem" : undefined }}
              >
                {activeLabelPrefix ? `${activeLabelPrefix} ` : ""}Activos:{" "}
                {active}
              </Typography>
            )}
            {inactive !== undefined && (
              <Typography
                variant="caption"
                display="block"
                color="text.disabled"
                sx={{ fontSize: small ? "0.7rem" : undefined }}
              >
                {activeLabelPrefix ? `${activeLabelPrefix} ` : ""}Inactivos:{" "}
                {inactive}
              </Typography>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
