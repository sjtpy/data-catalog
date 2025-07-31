import { BadRequestError } from '../utils/exceptions';
import { validate as validateUUID } from 'uuid';
import { EventType } from '../types/eventTypes';

export interface CreateEventData {
    name: string;
    type: string;
    description: string;
    properties?: { name: string; type: string; description: string }[];
}

export const validateCreateEventRequest = (data: any): CreateEventData => {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
    }

    if (!data.type || typeof data.type !== 'string') {
        errors.push('Type is required and must be a string');
    } else if (!Object.values(EventType).includes(data.type as EventType)) {
        errors.push(`Type must be one of: ${Object.values(EventType).join(', ')}`);
    }

    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
        errors.push('Description is required and must be a non-empty string');
    }

    if (data.properties !== undefined) {
        if (!Array.isArray(data.properties)) {
            errors.push('Properties must be an array');
        } else {
            data.properties.forEach((prop: any, index: number) => {
                if (!prop.name || typeof prop.name !== 'string' || prop.name.trim().length === 0) {
                    errors.push(`Property ${index + 1}: name is required and must be a non-empty string`);
                }
                if (!prop.type || typeof prop.type !== 'string') {
                    errors.push(`Property ${index + 1}: type is required and must be a string`);
                } else if (!['string', 'number', 'boolean'].includes(prop.type)) {
                    errors.push(`Property ${index + 1}: type must be one of: string, number, boolean`);
                }
                if (!prop.description || typeof prop.description !== 'string' || prop.description.trim().length === 0) {
                    errors.push(`Property ${index + 1}: description is required and must be a non-empty string`);
                }
            });
        }
    }

    if (errors.length > 0) {
        throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
    }

    return {
        name: data.name.trim(),
        type: data.type,
        description: data.description.trim(),
        properties: data.properties
    };
};

export const validateUpdateEventRequest = (data: any) => {
    const errors: string[] = [];
    const updateData: any = {};

    if (data.name !== undefined) {
        if (typeof data.name !== 'string' || data.name.trim().length === 0) {
            errors.push('Name must be a non-empty string');
        } else {
            updateData.name = data.name.trim();
        }
    }

    if (data.type !== undefined) {
        if (typeof data.type !== 'string') {
            errors.push('Type must be a string');
        } else if (!Object.values(EventType).includes(data.type as EventType)) {
            errors.push(`Type must be one of: ${Object.values(EventType).join(', ')}`);
        } else {
            updateData.type = data.type;
        }
    }

    if (data.description !== undefined) {
        if (typeof data.description !== 'string' || data.description.trim().length === 0) {
            errors.push('Description must be a non-empty string');
        } else {
            updateData.description = data.description.trim();
        }
    }

    if (errors.length > 0) {
        throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
    }

    return updateData;
};

export const validateEventId = (id: any): string => {
    if (!id || typeof id !== 'string') {
        throw new BadRequestError('Event ID is required and must be a string');
    }

    if (!validateUUID(id)) {
        throw new BadRequestError('Event ID must be a valid UUID format');
    }

    return id;
};

export const validateEventParams = (params: any): { id: string } => {
    if (!params || typeof params !== 'object') {
        throw new BadRequestError('Invalid request parameters');
    }

    const id = validateEventId(params.id);

    return { id };
}; 