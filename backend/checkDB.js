require('dotenv').config();
const { prisma } = require('./config/db');

async function check() {
  const c = await prisma.attendance.count();
  console.log("Total attendances:", c);
  if (c > 0) {
    const first = await prisma.attendance.findFirst({ orderBy: { date: 'asc' } });
    const last = await prisma.attendance.findFirst({ orderBy: { date: 'desc' } });
    console.log("Date range:", first.date, "to", last.date);
  }
}
check();
