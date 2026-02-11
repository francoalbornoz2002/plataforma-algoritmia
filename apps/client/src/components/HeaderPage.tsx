import {
  Paper,
  Stack,
  Typography,
  Box,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { ReactNode } from "react";

interface HeaderPageProps {
  title: string;
  description: string;
  icon: ReactNode;
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
  sx?: SxProps<Theme>;
}

export default function HeaderPage({
  title,
  description,
  icon,
  color = "primary",
  sx,
}: HeaderPageProps) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        borderLeft: "5px solid",
        borderColor: `${color}.main`,
        ...sx,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Box
          sx={{ color: `${color}.main`, display: "flex", alignItems: "center" }}
        >
          {icon}
        </Box>
        <Typography variant="h5" color={`${color}.main`} fontWeight="bold">
          {title}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  );
}
