import { useState, useEffect } from "react";
import {
  Box,
  Button,
  MenuItem,
  Typography,
  Alert,
  Paper,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableOnIcon from "@mui/icons-material/TableChart";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import { roles } from "../../../types";
import {
  getUsersList,
  type UsersListFilters,
} from "../service/reports.service";

export default function ListReportSection() {
  const [filters, setFilters] = useState<UsersListFilters>({
    fechaCorte: "",
    rol: "",
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos al montar y al cambiar filtros
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUsersList(filters);
      setData(response);
    } catch (err) {
      console.error(err);
      setError("Error al generar el listado.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent,
  ) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name as string]: value });
  };

  const columns: GridColDef[] = [
    { field: "nombre", headerName: "Nombre", flex: 1 },
    { field: "apellido", headerName: "Apellido", flex: 1 },
    { field: "email", headerName: "Email", flex: 1.5 },
    { field: "rol", headerName: "Rol", flex: 0.8 },
    {
      field: "createdAt",
      headerName: "Fecha Alta",
      flex: 1,
      valueFormatter: (value: any) =>
        value ? new Date(value).toLocaleDateString() : "-",
    },
    {
      field: "estado",
      headerName: "Estado",
      flex: 0.8,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === "Activo" ? "success" : "error"}
          variant="filled"
        />
      ),
    },
  ];

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
      >
        Inventario de Usuarios
      </Typography>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <DatePicker
            label="Fecha de Corte (Opcional)"
            disableFuture
            value={
              filters.fechaCorte
                ? new Date(filters.fechaCorte + "T00:00:00")
                : null
            }
            onChange={(value) =>
              setFilters({
                ...filters,
                fechaCorte: value ? format(value, "yyyy-MM-dd") : "",
              })
            }
            slotProps={{ textField: { size: "small" } }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Rol</InputLabel>
            <Select
              label="Rol"
              name="rol"
              value={filters.rol}
              onChange={handleChange}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.values(roles).map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Acciones de Exportación */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          disabled={data.length === 0}
          color="error"
        >
          Exportar PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<TableOnIcon />}
          disabled={data.length === 0}
          color="success"
        >
          Exportar Excel
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper sx={{ height: 500, width: "100%" }}>
        <DataGrid
          rows={data}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
}
