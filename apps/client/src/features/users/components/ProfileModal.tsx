import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Avatar,
  Box,
  IconButton,
  MenuItem,
  CircularProgress,
  Typography,
} from "@mui/material";
import { PhotoCamera } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSnackbar } from "notistack";
import { useAuth } from "../../authentication/context/AuthProvider";
import { updateUserProfile } from "../services/user.service";
import type { UserData } from "../../../types";

// Esquema de validación
const profileSchema = z
  .object({
    genero: z.enum(["Masculino", "Femenino", "Otro"]),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.password !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Las contraseñas no coinciden",
      path: ["confirmPassword"],
    },
  );

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { profile, refreshProfile } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const baseUrl = import.meta.env.VITE_API_URL_WITHOUT_PREFIX;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para la imagen seleccionada (preview)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (open && profile) {
      reset({
        genero: profile.genero,
        password: "",
        confirmPassword: "",
      });
      setPreviewUrl(
        profile.fotoPerfilUrl ? `${baseUrl}${profile.fotoPerfilUrl}` : null,
      );
      setSelectedFile(null);
    }
  }, [open, profile, reset]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!profile) return;

    if (selectedFile) {
      // Validar tipo de archivo (JPG, JPEG, PNG)
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(selectedFile.type)) {
        enqueueSnackbar("Solo se permiten archivos JPG, JPEG o PNG.", {
          variant: "error",
          anchorOrigin: { vertical: "top", horizontal: "center" },
        });
        return;
      }

      // Validar tamaño de archivo (2MB)
      if (selectedFile.size > 2 * 1024 * 1024) {
        enqueueSnackbar("La imagen no debe superar los 2 MB.", {
          variant: "error",
          anchorOrigin: { vertical: "top", horizontal: "center" },
        });
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append("genero", data.genero);

      if (data.password) {
        formData.append("password", data.password);
      }

      if (selectedFile) {
        formData.append("fotoPerfil", selectedFile);
      }

      await updateUserProfile(profile.id, formData);

      enqueueSnackbar("Perfil actualizado correctamente", {
        variant: "success",
      });
      await refreshProfile(); // Actualizar el contexto global
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error al actualizar el perfil", { variant: "error" });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Mi Cuenta</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2} alignItems="center">
            {/* Avatar con botón de subida */}
            <Box position="relative">
              <Avatar
                src={previewUrl || undefined}
                sx={{
                  width: 100,
                  height: 100,
                  cursor: isSubmitting ? "default" : "pointer",
                }}
                onClick={!isSubmitting ? handleAvatarClick : undefined}
              >
                {profile?.nombre?.[0]}
              </Avatar>
              {isSubmitting && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(0, 0, 0, 0.3)",
                    borderRadius: "50%",
                    zIndex: 1,
                  }}
                >
                  <CircularProgress size={40} sx={{ color: "white" }} />
                </Box>
              )}
              <IconButton
                color="primary"
                aria-label="upload picture"
                component="span"
                disabled={isSubmitting}
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  bgcolor: "background.paper",
                  boxShadow: 1,
                  "&:hover": { bgcolor: "grey.200" },
                }}
                onClick={handleAvatarClick}
              >
                <PhotoCamera />
              </IconButton>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Haz clic en la imagen para cambiarla
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: -2 }}
            >
              Tamaño máximo: 2 MB. Formatos: JPG, PNG.
            </Typography>

            {/* Campos del formulario */}
            <TextField
              select
              label="Género"
              fullWidth
              defaultValue={profile?.genero || "Otro"}
              {...register("genero")}
              error={!!errors.genero}
              helperText={errors.genero?.message}
            >
              <MenuItem value="Masculino">Masculino</MenuItem>
              <MenuItem value="Femenino">Femenino</MenuItem>
              <MenuItem value="Otro">Otro</MenuItem>
            </TextField>

            <TextField
              label="Nueva Contraseña (Opcional)"
              type="password"
              fullWidth
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <TextField
              label="Confirmar Nueva Contraseña"
              type="password"
              fullWidth
              {...register("confirmPassword")}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : "Guardar Cambios"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
