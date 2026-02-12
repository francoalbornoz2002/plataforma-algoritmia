import { useState, useEffect, type ReactNode } from "react";
import { Box, CircularProgress } from "@mui/material";
import { CourseProvider, useCourseContext } from "../context/CourseContext";
import { useAuth } from "../features/authentication/context/AuthProvider";
import type { UserData, MenuItemType } from "../types";
import Sidebar from "./sidebar/Sidebar";
import CourseSelectionModal from "../features/courses/components/CourseSelectionModal";

// --- Este es el componente interno que tiene la lógica ---
function ContextLayout({
  menuItems,
  user,
  userPhotoUrl,
  children,
}: {
  menuItems: MenuItemType[];
  user: UserData;
  userPhotoUrl?: string | null;
  children: ReactNode;
}) {
  // 1. Nos conectamos al contexto
  const { selectedCourse, isLoading } = useCourseContext();
  const { mustChangePassword } = useAuth();

  // 2. Estado para controlar el modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 3. Efecto "Guardián": Se ejecuta cuando el contexto carga
  useEffect(() => {
    // Si NO estamos cargando, NO hay curso seleccionado
    // Y NO hay un cambio de contraseña pendiente (mustChangePassword === false)
    if (!isLoading && !selectedCourse && !mustChangePassword) {
      setIsModalOpen(true); // Forzamos abrir el modal
    }
  }, [isLoading, selectedCourse, mustChangePassword]);

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
      <CourseSelectionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)} // Permitir cerrarlo por ahora
        role={user.rol}
      />
      <Box
        sx={{
          filter: isModalOpen ? "blur(5px)" : "none",
          transition: "filter 0.3s ease-out",
          pointerEvents: isModalOpen ? "none" : "auto", // Evita clics en el fondo
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Sidebar
          menuItems={menuItems}
          userInitial={(user?.nombre || "U")[0]} // Pasamos la inicial
          userPhotoUrl={userPhotoUrl} // Pasamos la foto
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
  userPhotoUrl?: string | null;
  children: ReactNode;
}) {
  return (
    <CourseProvider>
      <ContextLayout {...props} />
    </CourseProvider>
  );
}
