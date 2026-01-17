import {neon} from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
    console.error('Warning: DATABASE_URL environment variable is not set. Database operations will fail.');
}

const sql = neon(process.env.DATABASE_URL || '');

export default sql;
