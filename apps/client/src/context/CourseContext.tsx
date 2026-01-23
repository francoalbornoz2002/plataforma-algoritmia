import {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
  useMemo,
} from "react";
import type { CursoParaEditar } from "../types"; // Importamos el tipo que ya definimos
import { findCourseById } from "../features/courses/services/courses.service"; // Importamos el servicio

// 1. Definimos la "forma" de nuestro contexto
interface CourseContextType {
  selectedCourse: CursoParaEditar | null;
  setSelectedCourse: (course: CursoParaEditar | null) => void;
  isLoading: boolean; // Para saber si estamos cargando el curso desde localStorage
}

// 2. Creamos el Contexto
const CourseContext = createContext<CourseContextType | undefined>(undefined);

// 3. Creamos el "Proveedor" (Provider)
// Este componente envolverá tu layout y contendrá toda la lógica
export function CourseProvider({ children }: { children: ReactNode }) {
  const [selectedCourse, setSelectedCourseState] =
    useState<CursoParaEditar | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Empezamos en 'true'

  // --- Lógica de Persistencia (localStorage) ---

  // Efecto 1: Al cargar la app, revisa si hay un curso guardado
  useEffect(() => {
    const fetchSavedCourse = async () => {
      const savedCourseId = localStorage.getItem("selectedCourseId");
      if (savedCourseId) {
        try {
          // Si encontramos un ID, buscamos los datos completos del curso
          const courseData = await findCourseById(savedCourseId);
          setSelectedCourseState(courseData);
        } catch (error) {
          // Si el curso guardado ya no existe (ej: fue borrado), limpiamos
          console.error("No se pudo cargar el curso guardado:", error);
          localStorage.removeItem("selectedCourseId");
          setSelectedCourseState(null);
        }
      } else {
        // No hay curso guardado
        setSelectedCourseState(null);
      }
      setIsLoading(false); // Terminamos de cargar
    };

    fetchSavedCourse();
  }, []); // El array vacío [] asegura que solo se ejecute 1 vez al inicio

  // Función 'setter' personalizada que actualiza el estado Y el localStorage
  const setSelectedCourse = (course: CursoParaEditar | null) => {
    setSelectedCourseState(course);
    if (course) {
      localStorage.setItem("selectedCourseId", course.id);
    } else {
      localStorage.removeItem("selectedCourseId");
    }
  };

  // Usamos 'useMemo' para evitar re-renders innecesarios
  const value = useMemo(
    () => ({
      selectedCourse,
      setSelectedCourse,
      isLoading,
    }),
    [selectedCourse, isLoading],
  );

  return (
    <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
  );
}

// 4. Creamos el Hook personalizado (para consumir el contexto)
// Esto evita tener que importar 'useContext' y 'CourseContext' en cada archivo
export function useCourseContext() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error(
      "useCourseContext debe ser usado dentro de un CourseProvider",
    );
  }
  return context;
}

// 5. Hook opcional (devuelve undefined si no hay provider)
// Útil para componentes compartidos entre Admin (sin contexto de curso) y Docente (con contexto)
export function useOptionalCourseContext() {
  return useContext(CourseContext);
}
