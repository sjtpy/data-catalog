import { PropertyType } from '../types';
import { BadRequestError, ConflictError, InternalServerError, NotFoundError, HttpError } from '../utils/exceptions';
import { PropertyRepository } from '../repositories/propertyRepository';

export class PropertyService {
    private static propertyRepository = new PropertyRepository();

    static async createProperty(data: {
        name: string;
        type: string;
        description: string;
    }): Promise<any> {
        // Validation
        if (!data.name || !data.type || !data.description) {
            throw new BadRequestError('Missing required fields: name, type, and description are required');
        }

        if (!Object.values(PropertyType).includes(data.type as PropertyType)) {
            throw new BadRequestError(`Invalid property type. Must be one of: ${Object.values(PropertyType).join(', ')}`);
        }

        // Check for existing property with same name and type
        const existingProperty = await this.propertyRepository.findByNameAndType(data.name, data.type);

        if (existingProperty) {
            throw new ConflictError(`Property with name '${data.name}' and type '${data.type}' already exists`);
        }

        try {
            const property = await this.propertyRepository.create({
                name: data.name,
                type: data.type,
                description: data.description
            });

            return property;
        } catch (error: any) {
            console.error('Error creating property:', error);
            if (error instanceof HttpError) {
                throw error;
            }

            throw new InternalServerError('Failed to create property');
        }
    }

    static async getAllProperties(): Promise<any[]> {
        try {
            const properties = await this.propertyRepository.findAll();
            return properties;
        } catch (error: any) {
            console.error('Error fetching properties:', error);
            throw new InternalServerError('Failed to fetch properties');
        }
    }

    static async getPropertyById(id: string): Promise<any> {
        try {
            const property = await this.propertyRepository.findById(id);

            if (!property) {
                throw new NotFoundError('Property not found');
            }

            return property;
        } catch (error: any) {
            if (error instanceof HttpError) {
                throw error;
            }
            console.error('Error fetching property:', error);
            throw new InternalServerError('Failed to fetch property');
        }
    }

    static async updateProperty(id: string, data: {
        name?: string;
        type?: string;
        description?: string;
    }): Promise<any> {
        try {
            // check existence
            const existingProperty = await this.propertyRepository.findById(id);

            if (!existingProperty) {
                throw new NotFoundError('Property not found');
            }

            if (data.type && !Object.values(PropertyType).includes(data.type as PropertyType)) {
                throw new BadRequestError(`Invalid property type. Must be one of: ${Object.values(PropertyType).join(', ')}`);
            }

            // Check for unique name and type combination if name or type is being updated
            if (data.name || data.type) {
                const newName = data.name || existingProperty.name;
                const newType = data.type || existingProperty.type;

                const duplicateProperty = await this.propertyRepository.findByNameAndType(newName, newType);

                if (duplicateProperty && duplicateProperty.id !== id) {
                    throw new ConflictError(`Property with name '${newName}' and type '${newType}' already exists`);
                }
            }

            const updatedProperty = await this.propertyRepository.update(id, {
                ...(data.name && { name: data.name }),
                ...(data.type && { type: data.type }),
                ...(data.description && { description: data.description })
            });

            return updatedProperty;

        } catch (error: any) {
            console.error('Error updating property:', error);

            if (error instanceof HttpError) {
                throw error;
            }

            throw new InternalServerError('Failed to update property');
        }
    }

    static async deleteProperty(id: string): Promise<{ success: boolean }> {
        try {
            const existingProperty = await this.propertyRepository.findById(id);

            if (!existingProperty) {
                throw new NotFoundError('Property not found');
            }

            await this.propertyRepository.softDelete(id);

            return { success: true };

        } catch (error: any) {
            console.error('Error deleting property:', error);

            if (error instanceof HttpError) {
                throw error;
            }

            throw new InternalServerError('Failed to delete property');
        }
    }
} 