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
  CircularProgress,
  InputAdornment,
  Box,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import { findEligibleAlumnos } from "../../users/services/alumnos.service";
import type { DocenteBasico } from "../../../types";
import { useCourseContext } from "../../../context/CourseContext";

interface SelectStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (student: DocenteBasico) => void;
}

export default function SelectStudentModal({
  open,
  onClose,
  onSelect,
}: SelectStudentModalProps) {
  const { selectedCourse } = useCourseContext();
  const [students, setStudents] = useState<DocenteBasico[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<DocenteBasico[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open && selectedCourse) {
      setLoading(true);
      findEligibleAlumnos(selectedCourse.id)
        .then((data) => {
          setStudents(data);
          setFilteredStudents(data);
        })
        .finally(() => setLoading(false));
    }
  }, [open, selectedCourse]);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFilteredStudents(
      students.filter(
        (s) =>
          s.nombre.toLowerCase().includes(lower) ||
          s.apellido.toLowerCase().includes(lower),
      ),
    );
  }, [searchTerm, students]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Seleccionar Alumno</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Buscar alumno..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2, mt: 1 }}
        />
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: "auto" }}>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <ListItem
                  key={student.id}
                  component="div"
                  onClick={() => {
                    onSelect(student);
                    onClose();
                  }}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                    borderRadius: 1,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${student.apellido}, ${student.nombre}`}
                  />
                </ListItem>
              ))
            ) : (
              <Typography align="center" color="text.secondary" sx={{ mt: 2 }}>
                No se encontraron alumnos elegibles.
              </Typography>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}
