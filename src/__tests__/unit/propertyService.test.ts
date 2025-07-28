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

        it('should throw BadRequestError for missing required fields', async () => {
            const invalidData = {
                name: 'user_id',
                // missing type and description
            };

            await expect(PropertyService.createProperty(invalidData as any)).rejects.toThrow('Missing required fields');
        });

        it('should throw BadRequestError for invalid property type', async () => {
            const invalidData = {
                name: 'user_id',
                type: 'invalid_type',
                description: 'User ID',
            };

            await expect(PropertyService.createProperty(invalidData)).rejects.toThrow('Invalid property type');
        });

        it('should throw ConflictError when property with same name and type exists', async () => {
            const propertyData = {
                name: 'user_id',
                type: 'string',
                description: 'User ID',
            };

            mockPrisma.property.findFirst.mockResolvedValue({ id: 'existing' });

            await expect(PropertyService.createProperty(propertyData)).rejects.toThrow('already exists');
        });
    });

    describe('updateProperty', () => {
        it('should update an existing property', async () => {
            const updateData = {
                name: 'user_identifier',
                type: 'string',
                description: 'Updated description',
            };

            const mockUpdatedProperty = {
                id: '1',
                ...updateData,
                createTime: new Date(),
                updateTime: new Date(),
            };

            mockPrisma.property.findFirst.mockResolvedValue({ id: '1' });
            mockPrisma.property.update.mockResolvedValue(mockUpdatedProperty);

            const result = await PropertyService.updateProperty('1', updateData);

            expect(result).toBeInstanceOf(Object);
            expect(result.name).toBe('user_identifier');
        });

        it('should throw NotFoundError when property not found', async () => {
            const updateData = {
                name: 'user_identifier',
                type: 'string',
                description: 'Updated description',
            };

            mockPrisma.property.findFirst.mockResolvedValue(null);

            await expect(PropertyService.updateProperty('999', updateData)).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteProperty', () => {
        it('should soft delete a property', async () => {
            const mockProperty = {
                id: '1',
                name: 'user_id',
                type: 'string',
                description: 'User ID',
                deletedAt: new Date(),
                createTime: new Date(),
                updateTime: new Date(),
            };

            mockPrisma.property.findFirst.mockResolvedValue({ id: '1' });
            mockPrisma.property.update.mockResolvedValue(mockProperty);

            const result = await PropertyService.deleteProperty('1');

            expect(result.success).toBe(true);
        });

        it('should throw NotFoundError when property not found', async () => {
            mockPrisma.property.findFirst.mockResolvedValue(null);

            await expect(PropertyService.deleteProperty('999')).rejects.toThrow(NotFoundError);
        });
    });
}); 