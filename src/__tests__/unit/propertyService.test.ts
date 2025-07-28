import { PropertyService } from '../../services/propertyService';
import { NotFoundError } from '../../utils/exceptions';

// Mock the Prisma client
jest.mock('../../services/prisma', () => ({
    property: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

describe('PropertyService', () => {
    let mockPrisma: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = require('../../services/prisma');
    });

    describe('getAllProperties', () => {
        it('should return all properties', async () => {
            const mockProperties = [
                { id: '1', name: 'user_id', type: 'string', description: 'User ID', createTime: new Date(), updateTime: new Date() },
                { id: '2', name: 'email', type: 'string', description: 'User email', createTime: new Date(), updateTime: new Date() },
            ];

            mockPrisma.property.findMany.mockResolvedValue(mockProperties);

            const result = await PropertyService.getAllProperties();

            expect(mockPrisma.property.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                orderBy: { createTime: 'desc' },
            });
            expect(result).toHaveLength(2);
            expect(result[0]).toBeInstanceOf(Object);
            expect(result[0].name).toBe('user_id');
        });
    });

    describe('getPropertyById', () => {
        it('should return property by id', async () => {
            const mockProperty = {
                id: '1',
                name: 'user_id',
                type: 'string',
                description: 'User ID',
                createTime: new Date(),
                updateTime: new Date(),
            };

            mockPrisma.property.findFirst.mockResolvedValue(mockProperty);

            const result = await PropertyService.getPropertyById('1');

            expect(result).toBeInstanceOf(Object);
            expect(result?.name).toBe('user_id');
        });

        it('should throw NotFoundError when property not found', async () => {
            mockPrisma.property.findFirst.mockResolvedValue(null);

            await expect(PropertyService.getPropertyById('999')).rejects.toThrow(NotFoundError);
        });
    });

    describe('createProperty', () => {
        it('should create a new property', async () => {
            const propertyData = {
                name: 'user_id',
                type: 'string',
                description: 'User ID',
            };

            const mockCreatedProperty = {
                id: '1',
                ...propertyData,
                createTime: new Date(),
                updateTime: new Date(),
            };

            mockPrisma.property.create.mockResolvedValue(mockCreatedProperty);

            const result = await PropertyService.createProperty(propertyData);

            expect(result).toBeInstanceOf(Object);
            expect(result.name).toBe('user_id');
        });
    });
}); 