require('dotenv').config();
const { prisma } = require('./config/db');

async function main() {
  try {
    const res = await prisma.$queryRawUnsafe(`
      SELECT a."studentId", u."fullName", COUNT(a.id) as total, SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present
      FROM "attendances" a
      JOIN "users" u ON a."studentId" = u.id
      GROUP BY a."studentId", u."fullName"
    `);
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}
main();
