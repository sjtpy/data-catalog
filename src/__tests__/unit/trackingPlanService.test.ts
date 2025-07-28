import { TrackingPlanService } from '../../services/trackingPlanService';
import { BadRequestError, NotFoundError } from '../../utils/exceptions';
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
    })),
}));

// Mock the dataUtils
jest.mock('../../utils/dataUtils', () => ({
    processEventData: jest.fn().mockResolvedValue([]),
    filterValidEventIds: jest.fn().mockResolvedValue([]),
}));

describe('TrackingPlanService', () => {
    describe('getAllTrackingPlans', () => {
        it('should handle empty tracking plans list', async () => {
            const result = await TrackingPlanService.getAllTrackingPlans();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('createTrackingPlan', () => {
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
    });
}); 