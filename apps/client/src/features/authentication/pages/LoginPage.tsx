import { useState } from 'react';
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
} from '@mui/material';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthProvider';

// --- Importamos el Schema y el Resolver ---
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormInputs } from '../validations/login.schema';

export default function LoginPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { login } = useAuth();

  // --- Inicialización de RHF (actualizada con Zod) ---
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }, // Usamos 'isSubmitting'
  } = useForm<LoginFormInputs>({
    mode: 'onBlur',
    resolver: zodResolver(loginSchema), // Conectamos Zod
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  // --- Función 'onSubmit' (actualizada) ---
  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    // (Ya no necesitamos setIsLoading ni setLoginError)
    try {
      // Llama a la función login del AuthProvider
      await login(data.email, data.password);

    } catch (error: any) {
      console.error('Error en LoginPage onSubmit:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Error al iniciar sesión.';
      
      // Llamamos al snackbar directamente
      enqueueSnackbar(message, { variant: 'error' });
    }
    // (Ya no necesitamos 'finally')
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column', // Para centrar mejor
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100',
      }}
    >
      {/* --- Usamos <Paper /> --- */}
      <Paper
        elevation={6} // Más sombra para que "flote"
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 2, // Bordes redondeados
        }}
      >
        <Stack
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          spacing={2} // Usamos 'spacing' de Stack
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            align="center"
            sx={{ fontWeight: 'bold' }} // Un poco más de énfasis
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
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email ? errors.email.message : ' '}
            disabled={isSubmitting}
          />

          <TextField
            required
            fullWidth
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            variant="outlined"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password ? errors.password.message : ' '}
            disabled={isSubmitting}
          />

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: -1 }}
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
            <Link href="#" variant="body2">
              Olvidé mi contraseña
            </Link>
          </Stack>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting}
            sx={{ mt: 2, py: 1.5 }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              'Ingresar'
            )}
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
    </Box>
  );
}