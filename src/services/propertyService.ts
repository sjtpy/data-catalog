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
        } catch (error) {
            console.error('Error creating property:', error);
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
} 