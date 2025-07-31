import { TrackingPlanService } from '../../services/trackingPlanService';
import { BadRequestError, NotFoundError, ConflictError, InternalServerError } from '../../utils/exceptions';
import { EventType } from '../../types/eventTypes';
import { PropertyType } from '../../types/propertyTypes';

// Mock the TrackingPlanRepository
jest.mock('../../repositories/trackingPlanRepository', () => ({
    TrackingPlanRepository: jest.fn().mockImplementation(() => ({
        findAll: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null),
        findByName: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        softDelete: jest.fn().mockResolvedValue({}),
        findManyByIds: jest.fn().mockResolvedValue([]),
        findByNameAndType: jest.fn().mockResolvedValue(null),
        createEvent: jest.fn().mockResolvedValue({}),
        createProperty: jest.fn().mockResolvedValue({}),
        updateEventDescription: jest.fn().mockResolvedValue({}),
        updateEventProperties: jest.fn().mockResolvedValue({}),
    })),
}));

jest.mock('../../utils/dataUtils', () => ({
    processEventData: jest.fn().mockResolvedValue([]),
    filterValidEventIds: jest.fn().mockResolvedValue([]),
}));

describe('TrackingPlanService', () => {
    let mockTrackingPlanRepository: any;
    let mockDataUtils: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockTrackingPlanRepository = require('../../repositories/trackingPlanRepository').TrackingPlanRepository;
        mockDataUtils = require('../../utils/dataUtils');

        // mock tracking plan repository
        const mockInstance = new mockTrackingPlanRepository();
        (TrackingPlanService as any).trackingPlanRepository = mockInstance;
    });

    describe('getAllTrackingPlans', () => {
        it('should handle empty tracking plans list', async () => {
            const result = await TrackingPlanService.getAllTrackingPlans();
            expect(Array.isArray(result)).toBe(true);
        });

        it('should return all tracking plans with filtered event IDs', async () => {
            const mockTrackingPlans = [
                {
                    id: '1',
                    name: 'user_onboarding',
                    description: 'User onboarding tracking plan',
                    eventIds: ['event1', 'event2', 'event3'],
                    createTime: new Date(),
                    updateTime: new Date()
                },
                {
                    id: '2',
                    name: 'ecommerce_tracking',
                    description: 'E-commerce tracking plan',
                    eventIds: ['event4'],
                    createTime: new Date(),
                    updateTime: new Date()
                }
            ];

            const mockInstance = (TrackingPlanService as any).trackingPlanRepository;
            mockInstance.findAll.mockResolvedValue(mockTrackingPlans);

            // Mock filterValidEventIds to return different results for different calls
            mockDataUtils.filterValidEventIds
                .mockResolvedValueOnce(['event1', 'event3']) // event2 was deleted
                .mockResolvedValueOnce(['event4']); // event4 is valid

            const result = await TrackingPlanService.getAllTrackingPlans();

            expect(result).toHaveLength(2);
            expect(result[0].eventIds).toEqual(['event1', 'event3']); // event2 filtered out
            expect(result[1].eventIds).toEqual(['event4']);
        });
    });

    describe('getTrackingPlanById', () => {
        it('should return tracking plan by id with filtered event IDs', async () => {
            const mockTrackingPlan = {
                id: '1',
                name: 'user_onboarding',
                description: 'User onboarding tracking plan',
                eventIds: ['event1', 'event2', 'event3'],
                createTime: new Date(),
                updateTime: new Date()
            };

            const mockInstance = (TrackingPlanService as any).trackingPlanRepository;
            mockInstance.findById.mockResolvedValue(mockTrackingPlan);

            mockDataUtils.filterValidEventIds.mockResolvedValue(['event1', 'event3']); // event2 was deleted

            const result = await TrackingPlanService.getTrackingPlanById('1');

            expect(result.id).toBe('1');
            expect(result.name).toBe('user_onboarding');
            expect(result.eventIds).toEqual(['event1', 'event3']); // event2 filtered out
        });

        it('should throw NotFoundError when tracking plan not found', async () => {
            const mockInstance = (TrackingPlanService as any).trackingPlanRepository;
            mockInstance.findById.mockResolvedValue(null);

            await expect(TrackingPlanService.getTrackingPlanById('999')).rejects.toThrow(NotFoundError);
            await expect(TrackingPlanService.getTrackingPlanById('999')).rejects.toThrow('Tracking plan not found');
        });
    });

    describe('createTrackingPlan', () => {
        it('should create a new tracking plan successfully', async () => {
            const trackingPlanData = {
                name: 'user_onboarding',
                description: 'User onboarding tracking plan',
                events: [
                    {
                        name: 'user_signup',
                        type: 'track',
                        description: 'User signup event',
                        properties: [
                            {
                                name: 'user_id',
                                type: PropertyType.STRING,
                                description: 'User ID',
                                required: true
                            }
                        ],
                        additionalProperties: 'allow'
                    }
                ]
            } as any;

            const mockInstance = (TrackingPlanService as any).trackingPlanRepository;
            mockInstance.findByName.mockResolvedValue(null);
            mockInstance.create.mockResolvedValue({
                id: '1',
                name: 'user_onboarding',
                description: 'User onboarding tracking plan',
                eventIds: ['event1']
            });

            mockDataUtils.processEventData.mockResolvedValue(['event1']);

            const result = await TrackingPlanService.createTrackingPlan(trackingPlanData);

            expect(result.name).toBe('user_onboarding');
            expect(result.description).toBe('User onboarding tracking plan');
            expect(result.eventIds).toEqual(['event1']);
        });

        it('should throw BadRequestError for missing required fields', async () => {
            const invalidData = {
                name: 'user_onboarding',
                // missing description
            };

            await expect(TrackingPlanService.createTrackingPlan(invalidData as any)).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError for empty events array', async () => {
            const invalidData = {
                name: 'user_onboarding',
                description: 'User onboarding tracking plan',
                events: [],
            };

            await expect(TrackingPlanService.createTrackingPlan(invalidData)).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError when name is missing', async () => {
            const invalidData = {
                description: 'User onboarding tracking plan',
                events: [
                    {
                        name: 'user_signup',
                        type: 'track',
                        description: 'User signup event',
                        properties: []
                    }
                ]
            } as any;

            await expect(TrackingPlanService.createTrackingPlan(invalidData)).rejects.toThrow(BadRequestError);
            await expect(TrackingPlanService.createTrackingPlan(invalidData)).rejects.toThrow('Missing required fields: name and description are required');
        });

        it('should throw BadRequestError when description is missing', async () => {
            const invalidData = {
                name: 'user_onboarding',
                events: [
                    {
                        name: 'user_signup',
                        type: 'track',
                        description: 'User signup event',
                        properties: []
                    }
                ]
            } as any;

            await expect(TrackingPlanService.createTrackingPlan(invalidData)).rejects.toThrow(BadRequestError);
            await expect(TrackingPlanService.createTrackingPlan(invalidData)).rejects.toThrow('Missing required fields: name and description are required');
        });

        it('should throw BadRequestError when events is null', async () => {
            const invalidData = {
                name: 'user_onboarding',
                description: 'User onboarding tracking plan',
                events: null
            };

            await expect(TrackingPlanService.createTrackingPlan(invalidData as any)).rejects.toThrow(BadRequestError);
            await expect(TrackingPlanService.createTrackingPlan(invalidData as any)).rejects.toThrow('At least one event is required to create a tracking plan.');
        });

        it('should throw ConflictError when tracking plan name already exists', async () => {
            const trackingPlanData = {
                name: 'existing_plan',
                description: 'User onboarding tracking plan',
                events: [
                    {
                        name: 'user_signup',
                        type: 'track',
                        description: 'User signup event',
                        properties: []
                    }
                ]
            } as any;

            const mockInstance = (TrackingPlanService as any).trackingPlanRepository;
            mockInstance.findByName.mockResolvedValue({
                id: 'existing',
                name: 'existing_plan',
                description: 'Existing plan'
            });

            await expect(TrackingPlanService.createTrackingPlan(trackingPlanData)).rejects.toThrow(ConflictError);
            await expect(TrackingPlanService.createTrackingPlan(trackingPlanData)).rejects.toThrow('Tracking plan with name \'existing_plan\' already exists');
        });
    });

    describe('updateTrackingPlan', () => {
        it('should update tracking plan successfully', async () => {
            const existingTrackingPlan = {
                id: '1',
                name: 'old_name',
                description: 'Old description',
                eventIds: ['event1']
            };

            const updateData = {
                name: 'new_name',
                description: 'New description'
            };

            const mockInstance = (TrackingPlanService as any).trackingPlanRepository;
            mockInstance.findById.mockResolvedValue(existingTrackingPlan);
            mockInstance.findByName.mockResolvedValue(null); // No duplicate name
            mockInstance.findManyByIds.mockResolvedValue([{ id: 'event1' }]);
            mockInstance.update.mockResolvedValue({
                ...existingTrackingPlan,
                ...updateData
            });

            const result = await TrackingPlanService.updateTrackingPlan('1', updateData);

            expect(result.name).toBe('new_name');
            expect(result.description).toBe('New description');
        });

        it('should throw NotFoundError when tracking plan not found for update', async () => {
            const updateData = {
                name: 'new_name',
                description: 'New description'
            };

            const mockInstance = (TrackingPlanService as any).trackingPlanRepository;
            mockInstance.findById.mockResolvedValue(null);

            await expect(TrackingPlanService.updateTrackingPlan('999', updateData)).rejects.toThrow(NotFoundError);
            await expect(TrackingPlanService.updateTrackingPlan('999', updateData)).rejects.toThrow('Tracking plan not found');
        });

        it('should throw ConflictError when updating to existing name', async () => {
            const existingTrackingPlan = {
                id: '1',
                name: 'old_name',
                description: 'Old description',
                eventIds: []
            };

            const updateData = {
                name: 'existing_name'
            };

            const mockInstance = (TrackingPlanService as any).trackingPlanRepository;
            mockInstance.findById.mockResolvedValue(existingTrackingPlan);
            mockInstance.findByName.mockResolvedValue({
                id: '2',
                name: 'existing_name',
                description: 'Existing plan'
            });

            await expect(TrackingPlanService.updateTrackingPlan('1', updateData)).rejects.toThrow(ConflictError);
            await expect(TrackingPlanService.updateTrackingPlan('1', updateData)).rejects.toThrow('Tracking plan with name \'existing_name\' already exists');
        });
    });

    describe('deleteTrackingPlan', () => {
        it('should soft delete tracking plan successfully', async () => {
            const existingTrackingPlan = {
                id: '1',
                name: 'user_onboarding',
                description: 'User onboarding tracking plan',
                eventIds: ['event1']
            };

            const mockInstance = (TrackingPlanService as any).trackingPlanRepository;
            mockInstance.findById.mockResolvedValue(existingTrackingPlan);
            mockInstance.softDelete.mockResolvedValue(undefined);

            const result = await TrackingPlanService.deleteTrackingPlan('1');

            expect(result.success).toBe(true);
            expect(mockInstance.softDelete).toHaveBeenCalledWith('1');
        });

        it('should throw NotFoundError when deleting non-existent tracking plan', async () => {
            const mockInstance = (TrackingPlanService as any).trackingPlanRepository;
            mockInstance.findById.mockResolvedValue(null);

            await expect(TrackingPlanService.deleteTrackingPlan('999')).rejects.toThrow(NotFoundError);
            await expect(TrackingPlanService.deleteTrackingPlan('999')).rejects.toThrow('Tracking plan not found');
        });
    });
}); 