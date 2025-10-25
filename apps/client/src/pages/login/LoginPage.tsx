import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../auth/AuthProvider";
import { CircularProgress } from "@mui/material";
import { useSnackbar } from "notistack";

// Defino el tipo de dato para los datos del formulario
interface LoginFormInputs {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginPage() {
  // Estado para controlar la visibilidad del modal o dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth(); // Obtiene la función login del contexto

  const from = location.state?.from?.pathname || "/dashboard";

  if (loginError) {
    enqueueSnackbar(loginError, { variant: "error" });
    setLoginError(null);
  }

  // Inicializa react-hook-form
  const {
    register, // Función para registrar inputs
    handleSubmit, // Función para envolver el manejador de envío
    control, // Necesario para componentes controlados como el Checkbox de MUI
    formState: { errors }, // Objeto que contiene los errores del formulario
  } = useForm<LoginFormInputs>({
    mode: "onBlur",
    defaultValues: {
      // Establece valores por defecto si es necesario
      email: "",
      password: "",
      remember: false,
    },
  });

  // Manejo de estados para el dialog o modal
  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  // Defino la función manejadora del envío
  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      // Llama a la función login del AuthProvider
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error("Error en LoginPage onSubmit:", error);
      // Muestra el error (AuthProvider ya lo formateó o es un error genérico)
      // Ajusta para acceder al mensaje de error específico de Axios si está disponible
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Error al iniciar sesión.";
      setLoginError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "grey.100",
      }}
    >
      <Card
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 400,
          boxShadow: 3,
        }}
      >
        <Stack
          //spacing={1.5}
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {/* 1. Title */}
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            align="center"
            sx={{ mb: 3 }}
          >
            Iniciar sesión
          </Typography>

          {/* Campo Email con react-hook-form */}
          <TextField
            required
            fullWidth
            id="email"
            label="Correo electrónico"
            autoComplete="email"
            variant="outlined"
            // Registra el campo con reglas de validación
            {...register("email", {
              required: "El correo electrónico es obligatorio",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Formato de correo inválido",
              },
            })}
            // Muestra los errores
            error={!!errors.email}
            helperText={errors.email ? errors.email.message : " "}
            slotProps={{
              formHelperText: {
                style: { minHeight: "1.25em" },
              },
            }}
            sx={{ mb: 1.5 }}
          />

          {/* Campo Contraseña con react-hook-form */}
          <TextField
            required
            fullWidth
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            variant="outlined"
            // Registra el campo con reglas de validación
            {...register("password", {
              required: "La contraseña es obligatoria",
              minLength: {
                value: 6,
                message: "La contraseña debe tener al menos 6 caracteres",
              },
            })}
            // Muestra los errores
            error={!!errors.password}
            helperText={errors.password ? errors.password.message : " "}
            slotProps={{
              formHelperText: {
                style: { minHeight: "1.25em" },
              },
            }}
            sx={{ mb: 0.5 }}
          />

          {/* Check de recordar contraseña y olvidé mi contraseña */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 0.5 }}
          >
            {/* Checkbox integrado con Controller */}
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
                      disabled={isLoading}
                    />
                  }
                  label="Recordar contraseña"
                />
              )}
            />
            <Link href="#" variant="body2">
              Olvidé mi contraseña
            </Link>
          </Stack>

          {/* 6. Botoón de login */}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 1 }}>
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Ingresar"
            )}
          </Button>

          {/* 7. Divider */}
          <Divider sx={{ my: 2 }}>O</Divider>

          {/* 8. "No tengo usuario" Link */}
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
      </Card>

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
    </Box>
  );
}
