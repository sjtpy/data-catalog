import { CreateTrackingPlanPayload, TrackingPlanEventData, TrackingPlanPropertyInput } from '../types/trackingPlanTypes';
import { EventType } from '../types/eventTypes';
import { BadRequestError, ConflictError, InternalServerError, NotFoundError, HttpError } from '../utils/exceptions';
import prisma from './prisma';

export class TrackingPlanService {
    static async createTrackingPlan(data: CreateTrackingPlanPayload): Promise<any> {
        // Validation
        if (!data.name || !data.description) {
            throw new BadRequestError('Missing required fields: name and description are required');
        }

        if (!data.events || data.events.length === 0) {
            throw new BadRequestError('At least one event is required to create a tracking plan.');
        }

        // Check for unique tracking plan name
        const existingTrackingPlan = await prisma.trackingPlan.findFirst({
            where: {
                name: data.name,
                deletedAt: null
            }
        });

        if (existingTrackingPlan) {
            throw new ConflictError(`Tracking plan with name '${data.name}' already exists`);
        }

        const eventIds: string[] = [];

        // Process each event
        for (const eventData of data.events) {
            if (!eventData.name || !eventData.description) {
                throw new BadRequestError('Event name and description are required');
            }

            // Check if event already exists
            const existingEvent = await prisma.event.findFirst({
                where: {
                    name: eventData.name,
                    type: eventData.type,
                    deletedAt: null
                }
            });

            let eventId: string;

            if (existingEvent) {
                // Check if description doesn't match, raise error
                if (existingEvent.description !== eventData.description) {
                    throw new ConflictError(`Event '${eventData.name}' already exists with a different description`);
                }
                eventId = existingEvent.id;
            } else {
                // Create new event
                const newEvent = await prisma.event.create({
                    data: {
                        name: eventData.name,
                        type: eventData.type,
                        description: eventData.description,
                        propertyIds: []
                    }
                });
                eventId = newEvent.id;
            }

            // Process properties for this event
            if (eventData.properties && eventData.properties.length > 0) {
                const propertyIds: string[] = [];

                for (const propertyData of eventData.properties) {
                    if (!propertyData.name || !propertyData.type || !propertyData.description) {
                        throw new BadRequestError(`Property name, type, and description are required for event '${eventData.name}'`);
                    }

                    // Check if property already exists
                    const existingProperty = await prisma.property.findFirst({
                        where: {
                            name: propertyData.name,
                            type: propertyData.type,
                            deletedAt: null
                        }
                    });

                    let propertyId: string;

                    if (existingProperty) {
                        // Check if description matches
                        if (existingProperty.description !== propertyData.description) {
                            throw new ConflictError(`Property '${propertyData.name}' of type '${propertyData.type}' already exists with a different description`);
                        }
                        propertyId = existingProperty.id;
                    } else {
                        // Create new property
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

                // Update event with property IDs
                await prisma.event.update({
                    where: { id: eventId },
                    data: { propertyIds }
                });
            }

            eventIds.push(eventId);
        }


        try {
            const trackingPlan = await prisma.trackingPlan.create({
                data: {
                    name: data.name,
                    description: data.description,
                    eventIds
                }
            });

            return trackingPlan;
        } catch (error: any) {
            console.error('Error creating tracking plan:', error);

            if (error instanceof HttpError) {
                throw error;
            }

            throw new InternalServerError('Failed to create tracking plan');
        }
    }

    static async getAllTrackingPlans(): Promise<any[]> {
        try {
            const trackingPlans = await prisma.trackingPlan.findMany({
                where: {
                    deletedAt: null
                },
                orderBy: {
                    createTime: 'desc'
                }
            });

            return trackingPlans;
        } catch (error) {
            console.error('Error fetching tracking plans:', error);
            throw new InternalServerError('Failed to fetch tracking plans');
        }
    }

    static async getTrackingPlanById(id: string): Promise<any> {
        try {
            const trackingPlan = await prisma.trackingPlan.findFirst({
                where: {
                    id,
                    deletedAt: null
                }
            });

            if (!trackingPlan) {
                throw new NotFoundError('Tracking plan not found');
            }

            return trackingPlan;
        } catch (error: any) {
            console.error('Error fetching tracking plan:', error);
            if (error instanceof HttpError) {
                throw error;
            }
            throw new InternalServerError('Failed to fetch tracking plan');
        }
    }

    static async updateTrackingPlan(id: string, data: {
        name?: string;
        description?: string;
        events?: TrackingPlanEventData[];
    }): Promise<any> {
        try {
            // check existence
            const existingTrackingPlan = await prisma.trackingPlan.findFirst({
                where: {
                    id,
                    deletedAt: null
                }
            });

            if (!existingTrackingPlan) {
                throw new NotFoundError('Tracking plan not found');
            }

            // Check for unique name
            if (data.name && data.name !== existingTrackingPlan.name) {
                const duplicateName = await prisma.trackingPlan.findFirst({
                    where: {
                        name: data.name,
                        deletedAt: null,
                        id: { not: id }
                    }
                });

                if (duplicateName) {
                    throw new ConflictError(`Tracking plan with name '${data.name}' already exists`);
                }
            }

            let eventIds: string[] = existingTrackingPlan.eventIds;

            // Process events only if provided (partial update, append/merge)
            if (data.events && data.events.length > 0) {
                // Fetch all existing events for this tracking plan
                const existingEvents = await prisma.event.findMany({
                    where: {
                        id: { in: existingTrackingPlan.eventIds },
                        deletedAt: null
                    }
                });

                // Build a map for quick lookup: key = name+type
                const eventKey = (e: { name: string; type: string }) => `${e.name}::${e.type}`;
                const existingEventMap = new Map<string, any>(existingEvents.map((e: any) => [eventKey(e), e]));
                const newEventIds: string[] = [...eventIds];

                for (const eventData of data.events) {
                    if (!eventData.name || !eventData.description) {
                        throw new BadRequestError('Event name and description are required');
                    }
                    const key = eventKey(eventData);
                    let eventId: string;

                    if (existingEventMap.has(key)) {
                        // Event exists, update description if needed
                        const existingEvent = existingEventMap.get(key)!;
                        if (existingEvent.description !== eventData.description) {
                            await prisma.event.update({
                                where: { id: existingEvent.id },
                                data: { description: eventData.description }
                            });
                        }
                        eventId = existingEvent.id;
                    } else {
                        // Check if event exists globally (not in this plan)
                        const globalEvent = await prisma.event.findFirst({
                            where: {
                                name: eventData.name,
                                type: eventData.type,
                                deletedAt: null
                            }
                        });
                        if (globalEvent) {
                            if (globalEvent.description !== eventData.description) {
                                throw new ConflictError(`Event '${eventData.name}' already exists with a different description`);
                            }
                            eventId = globalEvent.id;
                        } else {
                            // Create new event
                            const newEvent = await prisma.event.create({
                                data: {
                                    name: eventData.name,
                                    type: eventData.type,
                                    description: eventData.description,
                                    propertyIds: []
                                }
                            });
                            eventId = newEvent.id;
                        }
                        newEventIds.push(eventId);
                    }

                    // Process properties for this event
                    if (eventData.properties && eventData.properties.length > 0) {
                        const propertyIds: string[] = [];
                        for (const propertyData of eventData.properties) {
                            if (!propertyData.name || !propertyData.type || !propertyData.description) {
                                throw new BadRequestError(`Property name, type, and description are required for event '${eventData.name}'`);
                            }
                            // Check if property already exists
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
                        // Update event with property IDs
                        await prisma.event.update({
                            where: { id: eventId },
                            data: { propertyIds }
                        });
                    }
                }
                // Remove duplicates
                eventIds = Array.from(new Set(newEventIds));
            }

            const updatedTrackingPlan = await prisma.trackingPlan.update({
                where: { id },
                data: {
                    ...(data.name && { name: data.name }),
                    ...(data.description && { description: data.description }),
                    ...(data.events && { eventIds })
                }
            });

            return updatedTrackingPlan;

        } catch (error: any) {
            console.error('Error updating tracking plan:', error);

            // If it's already an HttpError, re-throw it
            if (error instanceof HttpError) {
                throw error;
            }

            throw new InternalServerError('Failed to update tracking plan');
        }
    }

    static async deleteTrackingPlan(id: string): Promise<{ success: boolean }> {
        try {
            const existingTrackingPlan = await prisma.trackingPlan.findFirst({
                where: {
                    id,
                    deletedAt: null
                }
            });

            if (!existingTrackingPlan) {
                throw new NotFoundError('Tracking plan not found');
            }

            await prisma.trackingPlan.update({
                where: { id },
                data: {
                    deletedAt: new Date()
                }
            });

            return { success: true };

        } catch (error: any) {
            console.error('Error deleting tracking plan:', error);

            // If it's already an HttpError, re-throw it
            if (error instanceof HttpError) {
                throw error;
            }

            throw new InternalServerError('Failed to delete tracking plan');
        }
    }
}