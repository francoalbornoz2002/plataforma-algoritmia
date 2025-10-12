import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {

    const [franco, yessi, admin] = await prisma.$transaction(
        async (prisma) => {
            const franco = await prisma.user.create({
                data: {
                    email: 'franco@mail.com',
                    firstName: 'Franco',
                    lastName: 'Albornoz',
                    password: 'franco123',
                    role: 'ALUMNO'
                },
            });

            const yessi = await prisma.user.create({
                data: {
                    email: 'yessica@mail.com',
                    firstName: 'Yessica',
                    lastName: 'Barbosa',
                    password: 'yessica20',
                    role: 'DOCENTE',
                },
            });

            const admin = await prisma.user.create({
                data: {
                    email: 'admin@mail.com',
                    firstName: 'Admin',
                    lastName: 'Admin',
                    password: 'admin123',
                    role: 'ADMIN',
                },
            });

            return [franco, yessi, admin]
        }
    );
    
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