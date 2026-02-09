import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Link,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Paper,
  Stack,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { useSnackbar } from "notistack";
import { useAuth } from "../context/AuthProvider";
import apiClient from "../../../lib/axios";

// --- Importamos el Schema y el Resolver ---
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormInputs } from "../validations/login.schema";
import { Lock, Mail, Visibility, VisibilityOff } from "@mui/icons-material";

export default function LoginPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openForgotDialog, setOpenForgotDialog] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  // --- Inicialización de RHF (actualizada con Zod) ---
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }, // Usamos 'isSubmitting'
  } = useForm<LoginFormInputs>({
    mode: "onBlur",
    resolver: zodResolver(loginSchema), // Conectamos Zod
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  const handleOpenForgotDialog = () => setOpenForgotDialog(true);
  const handleCloseForgotDialog = () => setOpenForgotDialog(false);

  const handleSendForgotPassword = async () => {
    if (!forgotEmail) return;
    setIsSendingForgot(true);
    try {
      await apiClient.post("/auth/forgot-password", { email: forgotEmail });
      enqueueSnackbar(
        "Si el correo existe, recibirás un enlace para restablecer tu contraseña.",
        { variant: "success" },
      );
      handleCloseForgotDialog();
    } catch (error) {
      enqueueSnackbar("Error al procesar la solicitud.", { variant: "error" });
    } finally {
      setIsSendingForgot(false);
    }
  };

  // --- Función 'onSubmit' (actualizada) ---
  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    // (Ya no necesitamos setIsLoading ni setLoginError)
    try {
      // Llama a la función login del AuthProvider
      await login(data.email, data.password);
    } catch (error: any) {
      console.error("Error en LoginPage onSubmit:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Error al iniciar sesión.";

      // Llamamos al snackbar directamente
      enqueueSnackbar(message, {
        variant: "error",
        anchorOrigin: {
          vertical: "top",
          horizontal: "center",
        },
      });
    }
    // (Ya no necesitamos 'finally')
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column", // Para centrar mejor
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        p: 2,
      }}
    >
      {/* --- Usamos <Paper /> --- */}
      <Paper
        elevation={24}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 420,
          borderRadius: 4,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          <img
            src="/logo_web.png"
            alt="Algoritmia"
            style={{ width: "100%", maxWidth: "280px", height: "auto" }}
          />
        </Box>

        <Divider sx={{ mb: 1 }} />
        <Stack
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          spacing={1.5} // Usamos 'spacing' de Stack
        >
          <Typography
            variant="h5"
            component="h2"
            align="center"
            sx={{ fontWeight: "bold", mb: 1 }}
          >
            Iniciar sesión
          </Typography>

          {/* --- Campos (actualizados con Zod) --- */}
          <TextField
            required
            fullWidth
            id="email"
            label="Correo electrónico"
            autoComplete="email"
            variant="outlined"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email ? errors.email.message : " "}
            disabled={isSubmitting}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            required
            sx={{ mb: -2 }}
            fullWidth
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            id="password"
            autoComplete="current-password"
            variant="outlined"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password ? errors.password.message : " "}
            disabled={isSubmitting}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        showPassword
                          ? "hide the password"
                          : "display the password"
                      }
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Controller
              name="remember"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      color="primary"
                      disabled={isSubmitting}
                    />
                  }
                  label="Recordarme"
                />
              )}
            />
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={handleOpenForgotDialog}
            >
              Olvidé mi contraseña
            </Link>
          </Stack>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting}
            sx={{ mt: 2, py: 1.5, fontWeight: "bold", fontSize: "1.1rem" }}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Ingresar"}
          </Button>

          <Divider sx={{ my: 2 }}>O</Divider>

          <Typography variant="body2" align="center">
            <Link
              component="button"
              type="button"
              onClick={handleOpenDialog}
              variant="body2"
            >
              No tengo usuario
            </Link>
          </Typography>
        </Stack>
      </Paper>
      {/* --- Fin del <Paper /> --- */}

      {/* Modal de "No tengo usuario" */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Información de Registro</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Para obtener un usuario en la plataforma Algoritmia, por favor,
            contacta al administrador de la institución o al docente a cargo de
            la materia.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} autoFocus>
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de "Olvidé mi contraseña" */}
      <Dialog open={openForgotDialog} onClose={handleCloseForgotDialog}>
        <DialogTitle>Recuperar Contraseña</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Ingresa tu correo electrónico y te enviaremos un enlace para
            restablecer tu contraseña.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="forgot-email"
            label="Correo electrónico"
            type="email"
            fullWidth
            variant="outlined"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForgotDialog}>Cancelar</Button>
          <Button onClick={handleSendForgotPassword} disabled={isSendingForgot}>
            {isSendingForgot ? "Enviando..." : "Enviar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
