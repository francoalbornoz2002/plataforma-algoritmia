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
  Stack,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  findEligibleAlumnos,
  type AlumnoElegible,
} from "../../users/services/alumnos.service";
import { useCourseContext } from "../../../context/CourseContext";
import StudentDifficultyDetailModal from "../../difficulties/components/StudentDifficultyDetailModal";

interface SelectStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (student: AlumnoElegible) => void;
}

const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX;

export default function SelectStudentModal({
  open,
  onClose,
  onSelect,
}: SelectStudentModalProps) {
  const { selectedCourse } = useCourseContext();
  const [students, setStudents] = useState<AlumnoElegible[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<AlumnoElegible[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingDifficultiesFor, setViewingDifficultiesFor] =
    useState<AlumnoElegible | null>(null);

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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Seleccionar Alumno</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          size="small"
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
                  alignItems="flex-start"
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={
                        student.fotoPerfilUrl
                          ? `${baseUrl}${student.fotoPerfilUrl}`
                          : undefined
                      }
                      sx={{ width: 48, height: 48, mr: 1, mt: 0.5 }}
                    >
                      {student.apellido[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${student.apellido}, ${student.nombre}`}
                    primaryTypographyProps={{ fontWeight: "bold" }}
                    secondary={
                      <Stack
                        direction="row"
                        spacing={1}
                        mt={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: "flex", alignItems: "center", mr: 1 }}
                        >
                          {student.totalDificultades} dificultades:
                        </Typography>
                        {student.gradoAlto > 0 && (
                          <Chip
                            size="small"
                            label={`${student.gradoAlto} Alto`}
                            color="error"
                            variant="outlined"
                          />
                        )}
                        {student.gradoMedio > 0 && (
                          <Chip
                            size="small"
                            label={`${student.gradoMedio} Medio`}
                            color="warning"
                            variant="outlined"
                          />
                        )}
                        {student.gradoBajo > 0 && (
                          <Chip
                            size="small"
                            label={`${student.gradoBajo} Bajo`}
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    }
                  />
                  <Stack
                    direction="column"
                    spacing={1}
                    alignItems="flex-end"
                    ml={2}
                  >
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => {
                        onSelect(student);
                        onClose();
                      }}
                      sx={{ width: 130 }}
                    >
                      Seleccionar
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => setViewingDifficultiesFor(student)}
                      sx={{ width: 130 }}
                    >
                      Dificultades
                    </Button>
                  </Stack>
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

      {/* Modal de detalles de dificultades */}
      {viewingDifficultiesFor && selectedCourse && (
        <StudentDifficultyDetailModal
          open={!!viewingDifficultiesFor}
          onClose={() => setViewingDifficultiesFor(null)}
          idCurso={selectedCourse.id}
          idAlumno={viewingDifficultiesFor.id}
          nombreAlumno={`${viewingDifficultiesFor.nombre} ${viewingDifficultiesFor.apellido}`}
        />
      )}
    </Dialog>
  );
}
