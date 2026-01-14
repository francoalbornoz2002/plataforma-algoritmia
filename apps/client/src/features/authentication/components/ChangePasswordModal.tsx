// c:\Users\franc\asc-tf-repos\plataforma-algoritmia\apps\client\src\features\authentication\components\ChangePasswordModal.tsx

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  Button,
  TextField,
  Stack,
  InputAdornment,
  IconButton,
  CircularProgress,
  Tooltip,
  Typography,
  Box,
  Avatar,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Visibility, VisibilityOff, Lock } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import apiClient from "../../../lib/axios";

// Esquema de validación local
const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .max(100, "La contraseña no puede exceder los 100 caracteres"),
    confirmPassword: z.string().min(1, "Debe confirmar la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface ChangePasswordModalProps {
  open: boolean;
  userId: string | undefined;
  onSuccess: () => void;
}

export default function ChangePasswordModal({
  open,
  userId,
  onSuccess,
}: ChangePasswordModalProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    if (!userId) return;

    try {
      // Enviamos la nueva contraseña y actualizamos ultimoAcceso a la fecha actual
      await apiClient.patch(`/users/edit/${userId}`, {
        password: data.password,
        ultimoAcceso: new Date().toISOString(),
      });

      enqueueSnackbar("Contraseña actualizada correctamente. ¡Bienvenido!", {
        variant: "success",
      });
      onSuccess();
    } catch (error: any) {
      console.error("Error updating password:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Error al actualizar la contraseña.",
        { variant: "error" }
      );
    }
  };

  return (
    <Dialog
      open={open}
      // Evitamos que se cierre al hacer clic fuera o presionar ESC
      disableEscapeKeyDown
      onClose={(_, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          // Solo permitimos cerrar vía lógica interna (éxito)
        }
      }}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <DialogContent sx={{ pt: 4, pb: 4, px: 3 }}>
        <Stack alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 56,
              height: 56,
            }}
          >
            <Lock fontSize="large" />
          </Avatar>
          <Box textAlign="center">
            <Typography
              variant="h5"
              component="h2"
              fontWeight="bold"
              color="primary.main"
              gutterBottom
            >
              Cambio de Contraseña
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ¡Bienvenido a la Plataforma Algoritmia!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Como es tu primer inicio de sesión y por seguridad, debes cambiar
              tu contraseña de acceso antes de continuar.
            </Typography>
          </Box>
        </Stack>
        <Stack
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          spacing={2.5}
          noValidate
        >
          <TextField
            label="Nueva Contraseña"
            fullWidth
            required
            type={showPassword ? "text" : "password"}
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message || " "}
            disabled={isSubmitting}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip
                      title={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Confirmar Contraseña"
            fullWidth
            required
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword")}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message || " "}
            disabled={isSubmitting}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip
                      title={
                        showConfirmPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      <IconButton
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            fullWidth
            sx={{ py: 1.5, mt: 1, fontWeight: "bold" }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Actualizar Contraseña"
            )}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
