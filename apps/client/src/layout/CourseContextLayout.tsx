import { useState, useEffect, type ReactNode } from "react";
import { Box, CircularProgress } from "@mui/material";
import { CourseProvider, useCourseContext } from "../context/CourseContext";
import type { UserData, MenuItemType } from "../types"; // Asumo que MenuItemType está en types
import Sidebar from "./sidebar/Sidebar";
// Importarás tu modal aquí cuando lo creemos
// import CourseSelectionModal from "./CourseSelectionModal";

// --- Este es el componente interno que tiene la lógica ---
function ContextLayout({
  menuItems,
  user,
  children,
}: {
  menuItems: MenuItemType[];
  user: UserData;
  children: ReactNode;
}) {
  // 1. Nos conectamos al contexto
  const { selectedCourse, isLoading } = useCourseContext();

  // 2. Estado para controlar el modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 3. Efecto "Guardián": Se ejecuta cuando el contexto carga
  useEffect(() => {
    // Si NO estamos cargando el curso Y AÚN no hay curso seleccionado
    if (!isLoading && !selectedCourse) {
      setIsModalOpen(true); // Forzamos abrir el modal
    }
  }, [isLoading, selectedCourse]);

  // 4. Función para el botón del avatar "Cambiar de curso"
  const openCourseSwitcher = () => {
    setIsModalOpen(true);
  };

  // 5. Lógica de renderizado
  if (isLoading) {
    // Mostramos un spinner global mientras se carga el curso desde localStorage
    // (Puedes reemplazar esto con un componente Skeleton/Spinner más bonito)
    return <CircularProgress sx={{ margin: "auto" }} />;
  }

  return (
    <>
      {/* AQUÍ IRÁ TU MODAL
        <CourseSelectionModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)} // Permitir cerrarlo por ahora
          role={user.rol}
        /> 
      */}

      {/* Aplicamos el desenfoque a todo el layout (Sidebar + contenido)
        si el modal está abierto.
      */}
      <Box
        sx={{
          filter: isModalOpen ? "blur(5px)" : "none",
          transition: "filter 0.3s ease-out",
          pointerEvents: isModalOpen ? "none" : "auto", // Evita clics en el fondo
        }}
      >
        <Sidebar
          menuItems={menuItems}
          userInitial={user.nombre[0]} // Pasamos la inicial
          onOpenCourseSwitcher={openCourseSwitcher} // Pasamos la función
        >
          {children} {/* El <Outlet /> de DashboardLayout irá aquí */}
        </Sidebar>
      </Box>
    </>
  );
}

// --- Este es el componente principal que exportamos ---
// Envuelve el layout con el Provider para que todo funcione
export default function CourseContextLayout(props: {
  menuItems: MenuItemType[];
  user: UserData;
  children: ReactNode;
}) {
  return (
    <CourseProvider>
      <ContextLayout {...props} />
    </CourseProvider>
  );
}
