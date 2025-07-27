import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'data_catalog',
    password: process.env.PGPASSWORD || 'postgres',
    port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
});

export default pool; 