import { EventType } from '../types';
import { BadRequestError, ConflictError, InternalServerError, NotFoundError, HttpError } from '../utils/exceptions';
import prisma from './prisma';

export class EventService {
    static async createEvent(data: {
        name: string;
        type: string;
        description: string;
        properties?: { name: string; type: string; description: string }[];
    }): Promise<any> {
        // existence validation
        if (!data.name || !data.type || !data.description) {
            throw new BadRequestError('Missing required fields: name, type, and description are required');
        }

        // Validate event type
        if (!Object.values(EventType).includes(data.type as EventType)) {
            throw new BadRequestError(`Invalid event type. Must be one of: ${Object.values(EventType).join(', ')}`);
        }

        // Check for unique name and type
        const existingEvent = await prisma.event.findFirst({
            where: {
                name: data.name,
                type: data.type,
                deletedAt: null
            }
        });

        if (existingEvent) {
            throw new ConflictError(`Event with name '${data.name}' and type '${data.type}' already exists`);
        }

        let propertyIds: string[] = [];
        if (data.properties && data.properties.length > 0) {
            for (const propertyData of data.properties) {
                if (!propertyData.name || !propertyData.type || !propertyData.description) {
                    throw new BadRequestError('Property name, type, and description are required');
                }
                const existingProperty = await prisma.property.findFirst({
                    where: {
                        name: propertyData.name,
                        type: propertyData.type,
                        deletedAt: null
                    }
                });
                let propertyId: string;
                if (existingProperty) {
                    if (existingProperty.description !== propertyData.description) {
                        throw new ConflictError(`Property '${propertyData.name}' of type '${propertyData.type}' already exists with a different description`);
                    }
                    propertyId = existingProperty.id;
                } else {
                    const newProperty = await prisma.property.create({
                        data: {
                            name: propertyData.name,
                            type: propertyData.type,
                            description: propertyData.description
                        }
                    });
                    propertyId = newProperty.id;
                }
                propertyIds.push(propertyId);
            }
        }

        try {
            const event = await prisma.event.create({
                data: {
                    name: data.name,
                    type: data.type,
                    description: data.description,
                    propertyIds
                }
            });

            return event;
        } catch (error: any) {
            console.error('Error creating event:', error);

            if (error instanceof HttpError) {
                throw error;
            }

            throw new InternalServerError('Failed to create event');
        }
    }

    static async getAllEvents(): Promise<any[]> {
        try {
            const events = await prisma.event.findMany({
                where: {
                    deletedAt: null
                },
                orderBy: {
                    createTime: 'desc'
                }
            });

            return events;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw new InternalServerError('Failed to fetch events');
        }
    }

    static async getEventById(id: string): Promise<any> {
        try {
            const event = await prisma.event.findFirst({
                where: {
                    id,
                    deletedAt: null
                }
            });

            if (!event) {
                throw new NotFoundError('Event not found');
            }

            return event;
        } catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }
            console.error('Error fetching event:', error);
            throw new InternalServerError('Failed to fetch event');
        }
    }

    static async updateEvent(id: string, data: {
        name?: string;
        type?: string;
        description?: string;
        properties?: { name: string; type: string; description: string }[];
    }): Promise<any> {
        try {
            const existingEvent = await prisma.event.findFirst({
                where: {
                    id,
                    deletedAt: null
                }
            });

            if (!existingEvent) {
                throw new NotFoundError('Event not found');
            }

            if (data.type && !Object.values(EventType).includes(data.type as EventType)) {
                throw new BadRequestError(`Invalid event type. Must be one of: ${Object.values(EventType).join(', ')}`);
            }

            // check for unique name and type combination
            if (data.name || data.type) {
                const newName = data.name || existingEvent.name;
                const newType = data.type || existingEvent.type;

                const duplicateEvent = await prisma.event.findFirst({
                    where: {
                        name: newName,
                        type: newType,
                        deletedAt: null,
                        id: { not: id }
                    }
                });

                if (duplicateEvent) {
                    throw new ConflictError(`Event with name '${newName}' and type '${newType}' already exists`);
                }
            }

            let propertyIds: string[] = existingEvent.propertyIds || [];
            if (data.properties && data.properties.length > 0) {
                const newPropertyIds: string[] = [];
                for (const propertyData of data.properties) {
                    if (!propertyData.name || !propertyData.type || !propertyData.description) {
                        throw new BadRequestError('Property name, type, and description are required');
                    }
                    const existingProperty = await prisma.property.findFirst({
                        where: {
                            name: propertyData.name,
                            type: propertyData.type,
                            deletedAt: null
                        }
                    });
                    let propertyId: string;
                    if (existingProperty) {
                        if (existingProperty.description !== propertyData.description) {
                            throw new ConflictError(`Property '${propertyData.name}' of type '${propertyData.type}' already exists with a different description`);
                        }
                        propertyId = existingProperty.id;
                    } else {
                        const newProperty = await prisma.property.create({
                            data: {
                                name: propertyData.name,
                                type: propertyData.type,
                                description: propertyData.description
                            }
                        });
                        propertyId = newProperty.id;
                    }
                    newPropertyIds.push(propertyId);
                }
                // Merge and deduplicate
                propertyIds = Array.from(new Set([...propertyIds, ...newPropertyIds]));
            }

            const updatedEvent = await prisma.event.update({
                where: { id },
                data: {
                    ...(data.name && { name: data.name }),
                    ...(data.type && { type: data.type }),
                    ...(data.description && { description: data.description }),
                    propertyIds
                }
            });

            return updatedEvent;

        } catch (error: any) {
            console.error('Error updating event:', error);

            if (error instanceof HttpError) {
                throw error;
            }

            throw new InternalServerError('Failed to update event');
        }
    }
} 