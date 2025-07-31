import { EventService } from '../../services/eventService';
import { BadRequestError, NotFoundError, InternalServerError } from '../../utils/exceptions';

// Mock the EventRepository
jest.mock('../../repositories/eventRepository', () => ({
    EventRepository: jest.fn().mockImplementation(() => ({
        findAll: jest.fn(),
        findById: jest.fn(),
        findByNameAndType: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
    })),
}));

// Mock the dataUtils
jest.mock('../../utils/dataUtils', () => ({
    filterValidPropertyIds: jest.fn(),
    processPropertyData: jest.fn(),
}));

describe('EventService', () => {
    let mockEventRepository: any;
    let mockDataUtils: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockEventRepository = require('../../repositories/eventRepository').EventRepository;
        mockDataUtils = require('../../utils/dataUtils');

        // mock event repository
        const mockInstance = new mockEventRepository();
        (EventService as any).eventRepository = mockInstance;
    });

    describe('getAllEvents', () => {
        it('should handle empty events list', async () => {
            // Setup mock to return empty array
            const mockInstance = (EventService as any).eventRepository;
            mockInstance.findAll.mockResolvedValue([]);

            const result = await EventService.getAllEvents();
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });

        it('should filter out deleted property IDs from events', async () => {
            //mock data
            const mockEvents = [
                {
                    id: '1',
                    name: 'user_signup',
                    type: 'track',
                    description: 'User signup event',
                    propertyIds: ['prop1', 'prop2', 'prop3'],
                    createTime: new Date(),
                    updateTime: new Date()
                }
            ];

            const mockInstance = (EventService as any).eventRepository;
            mockInstance.findAll.mockResolvedValue(mockEvents);
            mockDataUtils.filterValidPropertyIds.mockResolvedValue(['prop1', 'prop3']); // simulate prop2 deletion

            const result = await EventService.getAllEvents();

            expect(result).toHaveLength(1);
            expect(result[0].propertyIds).toEqual(['prop1', 'prop3']);
            expect(mockDataUtils.filterValidPropertyIds).toHaveBeenCalledWith(['prop1', 'prop2', 'prop3']);
        });

        it('should throw InternalServerError when database fails', async () => {
            // Arrange: Setup mock to fail
            const mockInstance = (EventService as any).eventRepository;
            mockInstance.findAll.mockRejectedValue(new Error('Database connection failed'));

            await expect(EventService.getAllEvents()).rejects.toThrow(InternalServerError);
            await expect(EventService.getAllEvents()).rejects.toThrow('Failed to fetch events');
        });

        it('should handle events with mixed property scenarios', async () => {
            // Arrange: Setup complex mock data
            const mockEvents = [
                {
                    id: '1',
                    name: 'user_signup',
                    type: 'track',
                    description: 'User signup event',
                    propertyIds: ['prop1', 'prop2'],
                    createTime: new Date(),
                    updateTime: new Date()
                },
                {
                    id: '2',
                    name: 'user_login',
                    type: 'track',
                    description: 'User login event',
                    propertyIds: [],
                    createTime: new Date(),
                    updateTime: new Date()
                },
                {
                    id: '3',
                    name: 'page_view',
                    type: 'page',
                    description: 'Page view event',
                    propertyIds: ['prop3'],
                    createTime: new Date(),
                    updateTime: new Date()
                }
            ];

            // Setup mocks
            const mockInstance = (EventService as any).eventRepository;
            mockInstance.findAll.mockResolvedValue(mockEvents);

            // Mock filterValidPropertyIds to return different values based on input
            mockDataUtils.filterValidPropertyIds.mockImplementation((propertyIds: string[]) => {
                if (propertyIds.includes('prop1') && propertyIds.includes('prop2')) {
                    return Promise.resolve(['prop1']); //simulate prop2 deletion
                } else if (propertyIds.length === 0) {
                    return Promise.resolve([]); // empty properties stay empty
                } else if (propertyIds.includes('prop3')) {
                    return Promise.resolve(['prop3']); // prop3 is valid
                }
                return Promise.resolve([]);
            });

            const result = await EventService.getAllEvents();

            expect(result).toHaveLength(3);
            expect(result[0].propertyIds).toEqual(['prop1']);
            expect(result[1].propertyIds).toEqual([]);
            expect(result[2].propertyIds).toEqual(['prop3']);

            // Verify that filterValidPropertyIds was called correctly
            expect(mockDataUtils.filterValidPropertyIds).toHaveBeenCalledTimes(2); // Only called for non-empty propertyIds
            expect(mockDataUtils.filterValidPropertyIds).toHaveBeenNthCalledWith(1, ['prop1', 'prop2']);
            expect(mockDataUtils.filterValidPropertyIds).toHaveBeenNthCalledWith(2, ['prop3']);
        });
    });

    describe('createEvent', () => {
        it('should create event with valid data (validation handled at route level)', async () => {
            const validData = {
                name: 'user_signup',
                type: 'page_view',
                description: 'User signup event',
                properties: []
            };

            const mockCreatedEvent = {
                id: '1',
                ...validData,
                propertyIds: [],
                createTime: new Date(),
                updateTime: new Date()
            };

            const mockInstance = (EventService as any).eventRepository;
            mockInstance.findByNameAndType.mockResolvedValue(null);
            mockInstance.create.mockResolvedValue(mockCreatedEvent);

            const result = await EventService.createEvent(validData);

            expect(result).toBeInstanceOf(Object);
            expect(result.name).toBe('user_signup');
        });
    });
}); 