import { BadRequestError } from '../utils/exceptions';
import { validate as validateUUID } from 'uuid';
import { CreateTrackingPlanPayload, TrackingPlanEventData } from '../types/trackingPlanTypes';

export type CreateTrackingPlanData = CreateTrackingPlanPayload;

export const validateCreateTrackingPlanRequest = (data: any): CreateTrackingPlanData => {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
    }

    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
        errors.push('Description is required and must be a non-empty string');
    }

    if (!data.events || !Array.isArray(data.events) || data.events.length === 0) {
        errors.push('Events are required and must be a non-empty array');
    } else {
        data.events.forEach((event: any, index: number) => {
            if (!event.name || typeof event.name !== 'string' || event.name.trim().length === 0) {
                errors.push(`Event ${index + 1}: name is required and must be a non-empty string`);
            }
            if (!event.type || typeof event.type !== 'string') {
                errors.push(`Event ${index + 1}: type is required and must be a string`);
            }
            if (!event.description || typeof event.description !== 'string' || event.description.trim().length === 0) {
                errors.push(`Event ${index + 1}: description is required and must be a non-empty string`);
            }
        });
    }

    if (errors.length > 0) {
        throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
    }

    return {
        name: data.name.trim(),
        description: data.description.trim(),
        events: data.events
    };
};

export const validateUpdateTrackingPlanRequest = (data: any) => {
    const errors: string[] = [];
    const updateData: any = {};

    if (data.name !== undefined) {
        if (typeof data.name !== 'string' || data.name.trim().length === 0) {
            errors.push('Name must be a non-empty string');
        } else {
            updateData.name = data.name.trim();
        }
    }

    if (data.description !== undefined) {
        if (typeof data.description !== 'string' || data.description.trim().length === 0) {
            errors.push('Description must be a non-empty string');
        } else {
            updateData.description = data.description.trim();
        }
    }

    if (data.events !== undefined) {
        if (!Array.isArray(data.events)) {
            errors.push('Events must be an array');
        } else if (data.events.length === 0) {
            errors.push('Events array cannot be empty');
        } else {
            data.events.forEach((event: any, index: number) => {
                if (!event.name || typeof event.name !== 'string' || event.name.trim().length === 0) {
                    errors.push(`Event ${index + 1}: name is required and must be a non-empty string`);
                }
                if (!event.type || typeof event.type !== 'string') {
                    errors.push(`Event ${index + 1}: type is required and must be a string`);
                }
                if (!event.description || typeof event.description !== 'string' || event.description.trim().length === 0) {
                    errors.push(`Event ${index + 1}: description is required and must be a non-empty string`);
                }
            });
            updateData.events = data.events;
        }
    }

    if (errors.length > 0) {
        throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
    }

    return updateData;
};

export const validateTrackingPlanId = (id: any): string => {
    if (!id || typeof id !== 'string') {
        throw new BadRequestError('Tracking plan ID is required and must be a string');
    }

    if (!validateUUID(id)) {
        throw new BadRequestError('Tracking plan ID must be a valid UUID format');
    }

    return id;
};

export const validateTrackingPlanParams = (params: any): { id: string } => {
    if (!params || typeof params !== 'object') {
        throw new BadRequestError('Invalid request parameters');
    }

    const id = validateTrackingPlanId(params.id);

    return { id };
}; 