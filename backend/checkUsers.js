require('dotenv').config();
const { prisma } = require('./config/db');

async function checkUsers() {
  const users = await prisma.user.findMany({
    where: { role: 'student' }
  });
  console.log(users.map(u => ({ email: u.email, fullName: u.fullName })));
}

checkUsers();
