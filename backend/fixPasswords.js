require('dotenv').config();
const { prisma } = require('./config/db');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Teacher@123', salt);

  await prisma.user.updateMany({
    where: { role: 'teacher', email: { in: ['jhatka@attendance.com', 'saluke@attendance.com'] } },
    data: { password: hashedPassword }
  });
  console.log('Fixed passwords for Jhatka and Saluke');
}

fixPasswords();
