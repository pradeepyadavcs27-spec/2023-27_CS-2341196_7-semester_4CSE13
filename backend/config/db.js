const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Initialize Prisma Client with PostgreSQL adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const connectDB = async () => {
  try {
    // Prisma connects automatically on the first query,
    // but we can enforce a connection here to verify the DB is up.
    await prisma.$connect();
    console.log('PostgreSQL Connected via Prisma');
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { prisma, connectDB };
