import {
  Card,
  CardContent,
  Box,
  Typography,
  Stack,
  Divider,
  CardActions,
  Button,
  Rating,
  Tooltip,
  IconButton, // <-- Para mostrar la valoración
} from "@mui/material";
import type { Consulta } from "../../../types";
import { estado_consulta } from "../../../types";

// Los chips que ya creamos
import TemaChip from "../../../components/TemaChip";
import EstadoConsultaChip from "../../../components/EstadoConsultaChip";
import { Delete, Edit } from "@mui/icons-material";

interface ConsultaCardProps {
  consulta: Consulta;
  onValorar: (consulta: Consulta) => void; // Función para abrir el modal de valoración
  onEdit: (consulta: Consulta) => void; // <-- 3. Nueva prop
  onDelete: (consulta: Consulta) => void; // <-- 3. Nueva prop
}

export default function ConsultaCard({
  consulta,
  onValorar,
  onEdit,
  onDelete,
}: ConsultaCardProps) {
  const {
    titulo,
    descripcion,
    tema,
    estado,
    respuestaConsulta,
    valoracionAlumno,
  } = consulta;

  return (
    <Card variant="outlined">
      {/* --- 1. PREGUNTA DEL ALUMNO --- */}
      <CardContent sx={{ pb: 1 }}>
        {/* Fila 1: Título y Estado */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ mb: 0, lineHeight: 1.3 }}
          >
            {titulo}
          </Typography>
          <EstadoConsultaChip estado={estado} />
        </Box>

        {/* Fila 2: Tema */}
        <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
          <TemaChip tema={tema} />
        </Stack>

        {/* Fila 3: Descripción */}
        <Typography variant="body2" color="text.secondary">
          {descripcion}
        </Typography>
      </CardContent>

      {/* --- 2. RESPUESTA DEL DOCENTE (Condicional) --- */}
      {respuestaConsulta && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ p: 2, bgcolor: "grey.50" }}>
            <Typography variant="subtitle2" gutterBottom>
              Respuesta de {respuestaConsulta.docente.nombre}{" "}
              {respuestaConsulta.docente.apellido}
            </Typography>
            <Typography variant="body2" color="text.primary">
              {respuestaConsulta.descripcion}
            </Typography>
          </Box>
        </>
      )}

      {/* --- 3. ACCIONES / VALORACIÓN (ACTUALIZADO) --- */}
      <Divider />
      <CardActions sx={{ justifyContent: "flex-end", p: 1, pt: 1.5 }}>
        {/* --- LÓGICA DE ACCIONES --- */}

        {/* Caso 1: Está PENDIENTE */}
        {consulta.estado === estado_consulta.Pendiente && (
          <Box>
            <Tooltip title="Editar consulta">
              <IconButton size="small" onClick={() => onEdit(consulta)}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Borrar consulta">
              <IconButton
                size="small"
                onClick={() => onDelete(consulta)}
                color="error"
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Caso 2: Está REVISADA */}
        {consulta.estado === estado_consulta.Revisada && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => onValorar(consulta)}
          >
            Valorar Respuesta
          </Button>
        )}

        {/* Caso 3: Está RESUELTA */}
        {consulta.estado === estado_consulta.Resuelta && (
          <Stack direction="column" alignItems="flex-end" sx={{ pr: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Tu valoración:
            </Typography>
            <Rating value={valoracionAlumno} readOnly />
          </Stack>
        )}
      </CardActions>
    </Card>
  );
}
