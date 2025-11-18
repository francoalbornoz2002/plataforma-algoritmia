import {
  Button,
  Html,
  Heading,
  Text,
  Container,
  Section,
} from '@react-email/components';

// Definimos la interfaz de las props para TypeScript
interface EmailBienvenidaProps {
  nombre: string;
  contrasena: string;
}

export const EmailBienvenida = ({
  nombre = 'Usuario',
  contrasena = '123456', // Valor por defecto para la previsualización
}: EmailBienvenidaProps) => {
  return (
    <Html>
      <Container style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <Heading style={{ color: '#333' }}>
          ¡Bienvenido a Algoritmia, {nombre}!
        </Heading>

        <Text style={{ fontSize: '16px', color: '#555' }}>
          Estamos muy contentos de que te unas. Se ha generado una cuenta para
          ti. Aquí tienes tus credenciales de acceso:
        </Text>

        {/* Sección de Credenciales */}
        <Section
          style={{
            backgroundColor: '#f4f4f4',
            padding: '20px',
            borderRadius: '8px',
            margin: '20px 0',
            textAlign: 'center',
          }}
        >
          <Text
            style={{
              margin: '0',
              fontSize: '14px',
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Tu contraseña de acceso
          </Text>
          <Text
            style={{
              margin: '10px 0 0 0',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111',
              fontFamily: 'monospace', // Fuente tipo código para evitar confusiones (l vs 1)
            }}
          >
            {contrasena}
          </Text>
        </Section>

        <Text style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
          Te recomendamos cambiar esta contraseña una vez que hayas iniciado
          sesión.
        </Text>

        <Button
          href="http://localhost:5173/login"
          style={{
            backgroundColor: '#5F51E8',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '5px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          Ir a la Plataforma
        </Button>
      </Container>
    </Html>
  );
};

export default EmailBienvenida;
