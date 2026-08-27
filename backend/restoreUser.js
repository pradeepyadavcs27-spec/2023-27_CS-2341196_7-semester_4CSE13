require('dotenv').config();
const { prisma } = require('./config/db');
const bcrypt = require('bcryptjs');

const restoreUser = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Pradeep@123', salt);

    const user = await prisma.user.upsert({
      where: { email: 'pyyadav3656@gmail.com' },
      update: {
        password: hashedPassword,
        role: 'admin'
      },
      create: {
        fullName: 'Pradeep Yadav',
        email: 'pyyadav3656@gmail.com',
        password: hashedPassword,
        role: 'admin',
        department: 'Administration',
      }
    });

    console.log('User restored in PostgreSQL:', user.email);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
};

restoreUser();
