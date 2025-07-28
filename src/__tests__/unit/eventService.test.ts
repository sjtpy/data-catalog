import { EventService } from '../../services/eventService';
import { BadRequestError, NotFoundError } from '../../utils/exceptions';

// Mock the EventRepository
jest.mock('../../repositories/eventRepository', () => ({
    EventRepository: jest.fn().mockImplementation(() => ({
        findAll: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null),
        findByNameAndType: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        softDelete: jest.fn().mockResolvedValue({}),
    })),
}));

// Mock the dataUtils
jest.mock('../../utils/dataUtils', () => ({
    filterValidPropertyIds: jest.fn().mockResolvedValue([]),
    processPropertyData: jest.fn().mockResolvedValue([]),
}));

describe('EventService', () => {
    describe('getAllEvents', () => {
        it('should handle empty events list', async () => {
            const result = await EventService.getAllEvents();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('createEvent', () => {
        it('should throw BadRequestError for missing required fields', async () => {
            const invalidData = {
                name: 'user_signup',
                // missing type and description
            };

            await expect(EventService.createEvent(invalidData as any)).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError for invalid event type', async () => {
            const invalidData = {
                name: 'user_signup',
                type: 'invalid_type',
                description: 'User signup event',
                properties: [],
            };

            await expect(EventService.createEvent(invalidData)).rejects.toThrow(BadRequestError);
        });
    });
}); 