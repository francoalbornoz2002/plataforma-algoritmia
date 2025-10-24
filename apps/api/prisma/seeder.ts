import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const [franco, yessi, admin] = await prisma.$transaction(async (prisma) => {
    const franco = await prisma.usuario.create({
      data: {
        nombre: 'Franco',
        apellido: 'Albornoz',
        dni: '44540659',
        fechaNacimiento: new Date(2002, 11, 23),
        email: 'franco@mail.com',
        password: await bcrypt.hash('franco123', 10),
        rol: 'ALUMNO',
      },
    });

    const yessi = await prisma.usuario.create({
      data: {
        nombre: 'Yessica',
        apellido: 'Barbosa',
        dni: '44540659',
        fechaNacimiento: new Date(2004, 10, 26),
        email: 'yessica@mail.com',
        password: await bcrypt.hash('yessica20', 10),
        rol: 'DOCENTE',
      },
    });

    const admin = await prisma.usuario.create({
      data: {
        nombre: 'Admin',
        apellido: 'Admin',
        dni: '44540659',
        fechaNacimiento: new Date(2002, 11, 23),
        email: 'admin@mail.com',
        password: await bcrypt.hash('admin123', 10),
        rol: 'ADMIN',
      },
    });

    return [franco, yessi, admin];
  });

  console.log([franco, yessi, admin]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
