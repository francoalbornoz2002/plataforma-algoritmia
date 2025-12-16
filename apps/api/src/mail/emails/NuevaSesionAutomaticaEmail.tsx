import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface NuevaSesionAutomaticaEmailProps {
  nombreAlumno: string;
  nombreCurso: string;
  nombreDificultad: string;
  fechaLimite: string;
  linkSesion: string;
}

export default function NuevaSesionAutomaticaEmail({
  nombreAlumno,
  nombreCurso,
  nombreDificultad,
  fechaLimite,
  linkSesion,
}: NuevaSesionAutomaticaEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nueva Sesión de Refuerzo Automática</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>¡Sesión de Refuerzo Generada!</Heading>
          <Text style={text}>Hola {nombreAlumno},</Text>
          <Text style={text}>
            Hemos detectado que estás teniendo dificultades con el tema{' '}
            <strong>{nombreDificultad}</strong> en el curso{' '}
            <strong>{nombreCurso}</strong>.
          </Text>
          <Text style={text}>
            Para ayudarte a mejorar, el sistema ha generado automáticamente una
            sesión de refuerzo personalizada. Es importante que la completes
            antes de la fecha límite para asegurar tu comprensión del tema.
          </Text>
          <Section style={box}>
            <Text style={paragraph}>
              <strong>Fecha Límite:</strong> {fechaLimite}
            </Text>
            <Text style={paragraph}>
              <strong>Tiempo estimado:</strong> 20 minutos
            </Text>
          </Section>
          <Section style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link href={linkSesion} style={button}>
              Ir a la Sesión
            </Link>
          </Section>
          <Text style={footer}>
            Recuerda: La práctica constante es la clave del éxito. ¡Tú puedes!
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 20px',
};

const box = {
  padding: '20px',
  backgroundColor: '#f0f0f0',
  borderRadius: '5px',
  margin: '20px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
};

const button = {
  backgroundColor: '#1976d2',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  marginTop: '20px',
};
