import { BadRequestError } from '../utils/exceptions';
import { validate as validateUUID } from 'uuid';

export interface CreatePropertyData {
    name: string;
    type: string;
    description: string;
}

export const validateCreatePropertyRequest = (data: any): CreatePropertyData => {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
    }

    if (!data.type || typeof data.type !== 'string') {
        errors.push('Type is required and must be a string');
    } else if (!['string', 'number', 'boolean'].includes(data.type)) {
        errors.push('Type must be one of: string, number, boolean');
    }

    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
        errors.push('Description is required and must be a non-empty string');
    }

    if (errors.length > 0) {
        throw new BadRequestError(`Validation failed: ${errors.join(', ')}`);
    }

    return {
        name: data.name.trim(),
        type: data.type,
        description: data.description.trim()
    };
};

export const validateUpdatePropertyRequest = (data: any) => {
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
        } else if (!['string', 'number', 'boolean'].includes(data.type)) {
            errors.push('Type must be one of: string, number, boolean');
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

export const validatePropertyId = (id: any): string => {
    if (!id || typeof id !== 'string') {
        throw new BadRequestError('Property ID is required and must be a string');
    }

    if (!validateUUID(id)) {
        throw new BadRequestError('Property ID must be a valid UUID format');
    }

    return id;
};

export const validatePropertyParams = (params: any): { id: string } => {
    const errors: string[] = [];

    if (!params || typeof params !== 'object') {
        throw new BadRequestError('Invalid request parameters');
    }

    const id = validatePropertyId(params.id);

    return { id };
}; 