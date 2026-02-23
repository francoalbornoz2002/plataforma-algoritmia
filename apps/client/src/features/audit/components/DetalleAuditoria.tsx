import { useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Typography,
  Chip,
  Stack,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { LogAuditoria } from "../../../types";

interface DetalleAuditoriaProps {
  open: boolean;
  onClose: () => void;
  log: LogAuditoria | null;
}

export default function DetalleAuditoria({
  open,
  onClose,
  log,
}: DetalleAuditoriaProps) {
  const theme = useTheme();

  // --- LÓGICA DE COMPARACIÓN DE VALORES ---
  const comparisonData = useMemo(() => {
    if (!log) return [];

    const oldData = log.valoresAnteriores || {};
    const newData = log.valoresNuevos || {};

    const allKeys = [
      ...new Set([...Object.keys(oldData), ...Object.keys(newData)]),
    ];

    return allKeys.map((key) => {
      const oldValue = oldData[key];
      const newValue = newData[key];

      const formatValue = (val: any) => {
        if (val === null) return "null";
        if (val === undefined) return "undefined";
        if (typeof val === "object") return JSON.stringify(val);
        if (val === "") return '""';
        return String(val);
      };

      const oldValueStr = formatValue(oldValue);
      const newValueStr = formatValue(newValue);

      const isDifferent = oldValueStr !== newValueStr;

      return {
        field: key,
        oldValue: oldValueStr,
        newValue: newValueStr,
        isDifferent: isDifferent,
      };
    });
  }, [log]);

  // --- HELPER PARA DETERMINAR COLOR DEL CHIP DE OPERACIÓN ---
  const getOperationColor = (
    operation: string,
    log: LogAuditoria,
  ): "default" | "success" | "info" | "error" => {
    let color: "default" | "success" | "info" | "error" = "default";

    const isSoftDelete =
      operation === "UPDATE" &&
      log.valoresAnteriores &&
      (log.valoresAnteriores as any).deleted_at === null &&
      log.valoresNuevos &&
      (log.valoresNuevos as any).deleted_at;

    if (operation === "INSERT") {
      color = "success";
    } else if (operation === "DELETE" || isSoftDelete) {
      color = "error";
    } else if (operation === "UPDATE") {
      color = "info";
    }

    return color;
  };

  // --- HELPER PARA OBTENER LABEL DE OPERACIÓN ---
  const getOperationLabel = (operation: string, log: LogAuditoria): string => {
    const isSoftDelete =
      operation === "UPDATE" &&
      log.valoresAnteriores &&
      (log.valoresAnteriores as any).deleted_at === null &&
      log.valoresNuevos &&
      (log.valoresNuevos as any).deleted_at;

    return isSoftDelete ? "DELETE" : operation;
  };

  if (!log) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalle de Auditoría</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* --- SECCIÓN: INFORMACIÓN DEL EVENTO --- */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Información del Evento
            </Typography>
            <Stack spacing={2}>
              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
              >
                {/* Fecha y Hora */}
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Fecha y Hora
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(log.fechaHora), "dd/MM/yyyy HH:mm:ss", {
                      locale: es,
                    })}
                  </Typography>
                </Box>

                {/* Usuario */}
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Usuario
                  </Typography>
                  <Typography variant="body2">
                    {log.usuarioModifico?.email || "Sistema"}
                  </Typography>
                </Box>

                {/* Operación */}
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Operación
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={getOperationLabel(log.operacion, log)}
                      color={getOperationColor(log.operacion, log)}
                      variant="outlined"
                      size="small"
                      sx={{ minWidth: 70 }}
                    />
                  </Box>
                </Box>

                {/* Tabla */}
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Tabla Afectada
                  </Typography>
                  <Typography variant="body2">{log.tablaAfectada}</Typography>
                </Box>

                {/* ID Fila */}
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Typography variant="caption" color="text.secondary">
                    ID Fila Afectada
                  </Typography>
                  <Typography variant="body2">{log.idFilaAfectada}</Typography>
                </Box>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* --- SECCIÓN: CAMBIOS REGISTRADOS --- */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Cambios Registrados
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: theme.palette.action.hover,
                      }}
                    >
                      Campo
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: theme.palette.action.hover,
                      }}
                    >
                      Valor Anterior
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: theme.palette.action.hover,
                      }}
                    >
                      Valor Nuevo
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comparisonData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="caption" color="text.secondary">
                          No hay datos de cambios disponibles
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    comparisonData.map((row) => (
                      <TableRow
                        key={row.field}
                        sx={{
                          backgroundColor: row.isDifferent
                            ? alpha(theme.palette.warning.main, 0.08)
                            : "inherit",
                          "&:hover": {
                            backgroundColor: row.isDifferent
                              ? alpha(theme.palette.warning.main, 0.15)
                              : alpha(theme.palette.action.hover, 0.05),
                          },
                          transition: "background-color 0.2s",
                        }}
                      >
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{
                            fontWeight: row.isDifferent ? "bold" : "normal",
                            color: row.isDifferent
                              ? "text.primary"
                              : "text.secondary",
                          }}
                        >
                          {row.field}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: row.isDifferent
                              ? theme.palette.error.main
                              : "text.secondary",
                            wordBreak: "break-word",
                            maxWidth: 250,
                            fontFamily: "monospace",
                            fontSize: "0.85rem",
                          }}
                        >
                          {row.oldValue}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: row.isDifferent
                              ? theme.palette.success.main
                              : "text.primary",
                            fontWeight: row.isDifferent ? "bold" : "normal",
                            wordBreak: "break-word",
                            maxWidth: 250,
                            backgroundColor: row.isDifferent
                              ? alpha(theme.palette.success.main, 0.05)
                              : "transparent",
                            fontFamily: "monospace",
                            fontSize: "0.85rem",
                          }}
                        >
                          {row.newValue}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
