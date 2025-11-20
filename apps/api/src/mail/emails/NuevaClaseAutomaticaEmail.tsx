import {
  Button,
  Html,
  Heading,
  Text,
  Container,
  Section,
  Link,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface NuevaClaseAutomaticaEmailProps {
  nombreDocente: string;
  nombreCurso: string;
  fechaClase: string; // Ej: "Jueves 25/11 - 10:00hs"
  fechaSiguienteClase: string; // Ej: "Lunes 29/11 - 14:00hs"
  cantidadConsultas: number;

  // Links de acción
  linkAceptar: string;
  linkReprogramar: string;
  linkManual: string;
}

export const NuevaClaseAutomaticaEmail = ({
  nombreDocente = 'Docente',
  nombreCurso = 'Curso',
  fechaClase = 'Fecha por definir',
  fechaSiguienteClase = 'Siguiente clase',
  cantidadConsultas = 0,
  linkAceptar = '#',
  linkReprogramar = '#',
  linkManual = '#',
}: NuevaClaseAutomaticaEmailProps) => {
  return (
    <Html>
      <Container style={containerStyle}>
        <Section style={alertHeaderStyle}>
          <Heading style={alertTitleStyle}>
            ⚡ Clase Automática Generada
          </Heading>
        </Section>

        <Section style={bodyStyle}>
          <Text style={textStyle}>
            Hola <strong>{nombreDocente}</strong>,
          </Text>
          <Text style={textStyle}>
            Se han acumulado{' '}
            <strong>{cantidadConsultas} consultas pendientes</strong> en{' '}
            <strong>{nombreCurso}</strong>. El sistema ha reservado un espacio
            automáticamente para resolverlas.
          </Text>

          {/* INFO DE LA CLASE ACTUAL */}
          <Section style={detailsBoxStyle}>
            <Text style={detailRowStyle}>
              📅 <strong>Propuesta Actual:</strong> {fechaClase}
            </Text>
            <Text style={detailRowStyle}>
              📅 <strong>Siguiente Opción:</strong> {fechaSiguienteClase}
            </Text>
            <Text style={detailRowStyle}>
              ⚠️ <strong>Estado:</strong> Pendiente de Asignación
            </Text>
          </Section>

          <Text style={textStyle}>Por favor, selecciona una acción:</Text>

          {/* BOTÓN 1: ACEPTAR TAL CUAL */}
          <Button
            href={linkAceptar}
            style={{ ...buttonBase, backgroundColor: '#2e7d32' }}
          >
            ✅ Aceptar esta fecha
          </Button>
          <Text style={subButtonStyle}>Se confirmará para: {fechaClase}</Text>

          <div style={{ height: '15px' }} />

          {/* BOTÓN 2: PASAR A LA SIGUIENTE */}
          <Button
            href={linkReprogramar}
            style={{ ...buttonBase, backgroundColor: '#0288d1' }}
          >
            🔄 Mover a la siguiente clase
          </Button>
          <Text style={subButtonStyle}>
            Se reprogramará para: {fechaSiguienteClase}
          </Text>

          <div style={{ height: '15px' }} />

          {/* BOTÓN 3: EDITAR MANUALMENTE */}
          <Button
            href={linkManual}
            style={{ ...buttonBase, backgroundColor: '#ed6c02' }}
          >
            ✏️ Elegir otra fecha manualmente
          </Button>

          <Hr style={{ margin: '25px 0', borderColor: '#eee' }} />

          <Text
            style={{
              fontSize: '12px',
              color: '#999',
              textAlign: 'center' as const,
            }}
          >
            * Al hacer clic, serás redirigido a la plataforma para confirmar la
            acción.
          </Text>
        </Section>
      </Container>
    </Html>
  );
};

export default NuevaClaseAutomaticaEmail;

// --- Estilos ---
const containerStyle = {
  fontFamily: 'sans-serif',
  maxWidth: '600px',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  overflow: 'hidden',
  margin: '0 auto',
};
const alertHeaderStyle = {
  backgroundColor: '#fff3cd',
  padding: '15px',
  textAlign: 'center' as const,
};
const alertTitleStyle = { color: '#856404', margin: '0', fontSize: '20px' };
const bodyStyle = { padding: '30px', backgroundColor: '#ffffff' };
const textStyle = { color: '#333', fontSize: '16px', lineHeight: '1.5' };
const detailsBoxStyle = {
  backgroundColor: '#f8f9fa',
  padding: '15px',
  borderRadius: '6px',
  border: '1px solid #dee2e6',
  margin: '20px 0',
};
const detailRowStyle = { margin: '5px 0', fontSize: '15px', color: '#495057' };
const subButtonStyle = {
  fontSize: '12px',
  color: '#666',
  textAlign: 'center' as const,
  margin: '5px 0 0 0',
};

const buttonBase = {
  color: '#fff',
  padding: '12px 20px',
  borderRadius: '6px',
  fontWeight: 'bold',
  textDecoration: 'none',
  fontSize: '14px',
  display: 'block',
  textAlign: 'center' as const,
  width: '100%',
  boxSizing: 'border-box' as const,
};
