import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import eventsRouter from './routes/events';
import propertiesRouter from './routes/properties';
import trackingPlansRouter from './routes/trackingPlans';
import { HttpError } from './utils/exceptions';
import prisma from './services/prisma';

dotenv.config();

const openApiPath = path.join(process.cwd(), 'openapi.yaml');
const swaggerDocument = YAML.load(openApiPath);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true
}));

// Middleware
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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

// Global error handler middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', error);

    if (error instanceof HttpError) {
        return res.status(error.statusCode).json({
            success: false,
            error: error.message
        });
    }

    // Default error response
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Documentation available at: http://localhost:${PORT}/api-docs`);
});

export { app }; 