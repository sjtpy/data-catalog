import request from 'supertest';
import express from 'express';
import { PropertyService } from '../../services/propertyService';
import propertiesRouter from '../../routes/properties';

// Mock the PropertyService
jest.mock('../../services/propertyService');

const app = express();
app.use(express.json());
app.use('/api/properties', propertiesRouter);

describe('Properties API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/properties', () => {
        it('should return all properties', async () => {
            const mockProperties = [
                {
                    id: '1',
                    name: 'user_id',
                    type: 'string',
                    description: 'User ID',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            (PropertyService.getAllProperties as jest.Mock).mockResolvedValue(mockProperties);

            const response = await request(app)
                .get('/api/properties')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].name).toBe('user_id');
        });
    });

    describe('POST /api/properties', () => {
        it('should create a new property', async () => {
            const propertyData = {
                name: 'user_id',
                type: 'string',
                description: 'User ID',
            };

            const mockCreatedProperty = {
                id: '1',
                ...propertyData,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (PropertyService.createProperty as jest.Mock).mockResolvedValue(mockCreatedProperty);

            const response = await request(app)
                .post('/api/properties')
                .send(propertyData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('user_id');
        });
    });
}); 