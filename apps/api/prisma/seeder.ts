import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const [franco, yessi, admin] = await prisma.$transaction(async (prisma) => {
    const franco = await prisma.usuario.create({
      data: {
        email: 'franco@mail.com',
        nombre: 'Franco',
        apellido: 'Albornoz',
        password: await bcrypt.hash('franco123', 10),
        rol: 'ALUMNO',
      },
    });

    const yessi = await prisma.usuario.create({
      data: {
        email: 'yessica@mail.com',
        nombre: 'Yessica',
        apellido: 'Barbosa',
        password: await bcrypt.hash('yessica20', 10),
        rol: 'DOCENTE',
      },
    });

    const admin = await prisma.usuario.create({
      data: {
        email: 'admin@mail.com',
        nombre: 'Admin',
        apellido: 'Admin',
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
