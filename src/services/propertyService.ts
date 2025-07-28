import { PropertyType } from '../types';
import { BadRequestError, ConflictError, InternalServerError, NotFoundError, HttpError } from '../utils/exceptions';
import prisma from './prisma';

export class PropertyService {
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
        const existingProperty = await prisma.property.findFirst({
            where: {
                name: data.name,
                type: data.type,
                deletedAt: null
            }
        });

        if (existingProperty) {
            throw new ConflictError(`Property with name '${data.name}' and type '${data.type}' already exists`);
        }

        try {
            // Create property using Prisma
            const property = await prisma.property.create({
                data: {
                    name: data.name,
                    type: data.type,
                    description: data.description
                }
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
            const properties = await prisma.property.findMany({
                where: {
                    deletedAt: null
                },
                orderBy: {
                    createTime: 'desc'
                }
            });

            return properties;
        } catch (error) {
            console.error('Error fetching properties:', error);
            throw new InternalServerError('Failed to fetch properties');
        }
    }

    static async getPropertyById(id: string): Promise<any> {
        try {
            const property = await prisma.property.findFirst({
                where: {
                    id,
                    deletedAt: null
                }
            });

            if (!property) {
                throw new NotFoundError('Property not found');
            }

            return property;
        } catch (error) {
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
            const existingProperty = await prisma.property.findFirst({
                where: {
                    id,
                    deletedAt: null
                }
            });

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

                const duplicateProperty = await prisma.property.findFirst({
                    where: {
                        name: newName,
                        type: newType,
                        deletedAt: null,
                        id: { not: id }
                    }
                });

                if (duplicateProperty) {
                    throw new ConflictError(`Property with name '${newName}' and type '${newType}' already exists`);
                }
            }

            const updatedProperty = await prisma.property.update({
                where: { id },
                data: {
                    ...(data.name && { name: data.name }),
                    ...(data.type && { type: data.type }),
                    ...(data.description && { description: data.description })
                }
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
            const existingProperty = await prisma.property.findFirst({
                where: {
                    id,
                    deletedAt: null
                }
            });

            if (!existingProperty) {
                throw new NotFoundError('Property not found');
            }

            await prisma.property.update({
                where: { id },
                data: {
                    deletedAt: new Date()
                }
            });

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