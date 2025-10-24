import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import type { GridRowsProp, GridColDef } from "@mui/x-data-grid";

export default function UsersPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestión de Usuarios
      </Typography>
      <Typography>
        Aquí irá la tabla y funcionalidades para administrar usuarios.
      </Typography>
    </Box>
  );
}
