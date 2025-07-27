import express from 'express';
import dotenv from 'dotenv';
import pool from './utils/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

pool.query('SELECT 1')
    .then(() => console.log('Connected to Postgres!'))
    .catch((err: unknown) => console.error('DB connection failed:', err));

app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 