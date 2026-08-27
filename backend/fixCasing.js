require('dotenv').config();
const { prisma } = require('./config/db');

async function fixCasing() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    if (u.email !== u.email.toLowerCase()) {
      await prisma.user.update({
        where: { id: u.id },
        data: { email: u.email.toLowerCase() }
      });
      console.log('Fixed:', u.email);
    }
  }
}
fixCasing();
