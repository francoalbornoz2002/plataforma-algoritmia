import { Paper, Stack, Typography, Box } from "@mui/material";
import type { ReactNode } from "react";

interface ReportTextualCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  description: ReactNode;
  color: "primary" | "secondary" | "error" | "info" | "success" | "warning";
  small?: boolean;
}

export default function ReportTextualCard({
  icon,
  title,
  value,
  description,
  color,
  small = false,
}: ReportTextualCardProps) {
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
      <Stack direction="column" spacing={small ? 0.25 : 0.5}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          mb={small ? 0.5 : 1}
        >
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
            color="textSecondary"
            fontWeight="bold"
            sx={{ lineHeight: 1.2 }}
          >
            {title}
          </Typography>
        </Stack>
        <Typography
          variant={small ? "subtitle1" : "h6"}
          fontWeight="bold"
          gutterBottom={!small}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontSize: small ? "0.7rem" : undefined,
            lineHeight: small ? 1.2 : undefined,
          }}
        >
          {description}
        </Typography>
      </Stack>
    </Paper>
  );
}
