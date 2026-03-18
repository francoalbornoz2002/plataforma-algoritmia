import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  InputAdornment,
  Checkbox,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import type { DocenteParaFiltro } from "../../../types";

interface SelectTeacherModalProps {
  open: boolean;
  onClose: () => void;
  allDocentes: DocenteParaFiltro[];
  initialSelection: DocenteParaFiltro[];
  onSelect: (selected: DocenteParaFiltro[]) => void;
}

export default function SelectTeacherModal({
  open,
  onClose,
  allDocentes,
  initialSelection,
  onSelect,
}: SelectTeacherModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<DocenteParaFiltro[]>([]);

  useEffect(() => {
    if (open) {
      setSelected(initialSelection);
      setSearchTerm("");
    }
  }, [open, initialSelection]);

  const filtered = allDocentes.filter(
    (d) =>
      d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.apellido.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggle = (docente: DocenteParaFiltro) => {
    const isSelected = selected.some((s) => s.id === docente.id);
    if (isSelected) {
      setSelected(selected.filter((s) => s.id !== docente.id));
    } else {
      setSelected([...selected, docente]);
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX || "";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Seleccionar Docentes</DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          placeholder="Buscar docente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        <List sx={{ maxHeight: 400, overflow: "auto" }}>
          {filtered.length > 0 ? (
            filtered.map((docente) => {
              const isSelected = selected.some((s) => s.id === docente.id);
              return (
                <ListItem
                  key={docente.id}
                  component="div"
                  onClick={() => handleToggle(docente)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                    borderRadius: 1,
                  }}
                >
                  <Checkbox checked={isSelected} tabIndex={-1} disableRipple />
                  <ListItemAvatar>
                    <Avatar
                      src={
                        docente.fotoPerfilUrl
                          ? `${baseUrl}${docente.fotoPerfilUrl}`
                          : undefined
                      }
                    >
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${docente.nombre} ${docente.apellido}`}
                  />
                </ListItem>
              );
            })
          ) : (
            <Typography align="center" color="text.secondary" sx={{ mt: 2 }}>
              No se encontraron docentes activos.
            </Typography>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Confirmar ({selected.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
