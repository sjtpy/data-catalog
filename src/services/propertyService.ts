import { PropertyType } from '../types';
import prisma from './prisma';

export class PropertyService {
    static async createProperty(data: {
        name: string;
        type: string;
        description: string;
    }): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            // Validation
            if (!data.name || !data.type || !data.description) {
                return {
                    success: false,
                    error: 'Missing required fields: name, type, and description are required'
                };
            }

            if (!Object.values(PropertyType).includes(data.type as PropertyType)) {
                return {
                    success: false,
                    error: `Invalid property type. Must be one of: ${Object.values(PropertyType).join(', ')}`
                };
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
                return {
                    success: false,
                    error: `Property with name '${data.name}' and type '${data.type}' already exists`
                };
            }

            // Create property using Prisma
            const property = await prisma.property.create({
                data: {
                    name: data.name,
                    type: data.type,
                    description: data.description
                }
            });

            return {
                success: true,
                data: property
            };

        } catch (error) {
            console.error('Error creating property:', error);

            return {
                success: false,
                error: 'Internal server error'
            };
        }
    }

    static async getAllProperties(): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const properties = await prisma.property.findMany({
                where: {
                    deletedAt: null
                },
                orderBy: {
                    createTime: 'desc'
                }
            });

            return {
                success: true,
                data: properties
            };

        } catch (error) {
            console.error('Error fetching properties:', error);
            return {
                success: false,
                error: 'Internal server error'
            };
        }
    }

    static async getPropertyById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const property = await prisma.property.findFirst({
                where: {
                    id,
                    deletedAt: null
                }
            });

            if (!property) {
                return {
                    success: false,
                    error: 'Property not found'
                };
            }

            return {
                success: true,
                data: property
            };

        } catch (error) {
            console.error('Error fetching property:', error);
            return {
                success: false,
                error: 'Internal server error'
            };
        }
    }
} 