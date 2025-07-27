import express from 'express';
import dotenv from 'dotenv';
import eventsRouter from './routes/events';
import propertiesRouter from './routes/properties';
import trackingPlansRouter from './routes/trackingPlans';
import prisma from './services/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Test Prisma connection
prisma.$connect()
    .then(() => console.log('Connected to database via Prisma!'))
    .catch((err: unknown) => console.error('Database connection failed:', err));

// Routes
app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

app.use('/api/events', eventsRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/plans', trackingPlansRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 