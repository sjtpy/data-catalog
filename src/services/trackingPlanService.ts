import { ApiResponse } from '../types';
import { CreateTrackingPlanPayload, TrackingPlanEventData, TrackingPlanPropertyInput } from '../types/trackingPlanTypes';
import { EventType } from '../types/eventTypes';
import prisma from './prisma';

export class TrackingPlanService {
    static async createTrackingPlan(data: CreateTrackingPlanPayload): Promise<{ success: boolean; data?: any; error?: string }> {
        try {

            if (!data.name || !data.description) {
                return {
                    success: false,
                    error: 'Missing required fields: name and description are required'
                };
            }

            if (!data.events || data.events.length === 0) {
                return {
                    success: false,
                    error: 'At least one event is required to create a tracking plan.'
                };
            }

            // unique name check
            const existingTrackingPlan = await prisma.trackingPlan.findFirst({
                where: {
                    name: data.name,
                    deletedAt: null
                }
            });

            if (existingTrackingPlan) {
                return {
                    success: false,
                    error: `Tracking plan with name '${data.name}' already exists`
                };
            }

            const eventIds: string[] = [];

            // Process each event
            for (const eventData of data.events) {
                if (!eventData.name || !eventData.description) {
                    return {
                        success: false,
                        error: 'Event name and description are required'
                    };
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
                        return {
                            success: false,
                            error: `Event '${eventData.name}' already exists with a different description`
                        };
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
                            return {
                                success: false,
                                error: `Property name, type, and description are required for event '${eventData.name}'`
                            };
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
                                return {
                                    success: false,
                                    error: `Property '${propertyData.name}' of type '${propertyData.type}' already exists with a different description`
                                };
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


            const trackingPlan = await prisma.trackingPlan.create({
                data: {
                    name: data.name,
                    description: data.description,
                    eventIds
                }
            });

            return {
                success: true,
                data: trackingPlan
            };

        } catch (error) {
            console.error('Error creating tracking plan:', error);

            return {
                success: false,
                error: 'Internal server error'
            };
        }
    }

    static async getAllTrackingPlans(): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const trackingPlans = await prisma.trackingPlan.findMany({
                where: {
                    deletedAt: null
                },
                orderBy: {
                    createTime: 'desc'
                }
            });

            return {
                success: true,
                data: trackingPlans
            };

        } catch (error) {
            console.error('Error fetching tracking plans:', error);
            return {
                success: false,
                error: 'Internal server error'
            };
        }
    }

    static async getTrackingPlanById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const trackingPlan = await prisma.trackingPlan.findFirst({
                where: {
                    id,
                    deletedAt: null
                }
            });

            if (!trackingPlan) {
                return {
                    success: false,
                    error: 'Tracking plan not found'
                };
            }

            return {
                success: true,
                data: trackingPlan
            };

        } catch (error) {
            console.error('Error fetching tracking plan:', error);
            return {
                success: false,
                error: 'Internal server error'
            };
        }
    }

    static async updateTrackingPlan(id: string, data: {
        name?: string;
        description?: string;
        eventIds?: string[];
    }): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            // Check if tracking plan exists
            const existingTrackingPlan = await prisma.trackingPlan.findFirst({
                where: {
                    id,
                    deletedAt: null
                }
            });

            if (!existingTrackingPlan) {
                return {
                    success: false,
                    error: 'Tracking plan not found'
                };
            }

            // Check for unique name if name is being updated
            if (data.name && data.name !== existingTrackingPlan.name) {
                const duplicateName = await prisma.trackingPlan.findFirst({
                    where: {
                        name: data.name,
                        deletedAt: null,
                        id: { not: id }
                    }
                });

                if (duplicateName) {
                    return {
                        success: false,
                        error: `Tracking plan with name '${data.name}' already exists`
                    };
                }
            }

            // Validate event IDs if provided
            if (data.eventIds && data.eventIds.length > 0) {
                const validEvents = await prisma.event.findMany({
                    where: {
                        id: { in: data.eventIds },
                        deletedAt: null
                    }
                });

                if (validEvents.length !== data.eventIds.length) {
                    return {
                        success: false,
                        error: 'One or more event IDs are invalid'
                    };
                }
            }

            const updatedTrackingPlan = await prisma.trackingPlan.update({
                where: { id },
                data: {
                    ...(data.name && { name: data.name }),
                    ...(data.description && { description: data.description }),
                    ...(data.eventIds && { eventIds: data.eventIds })
                }
            });

            return {
                success: true,
                data: updatedTrackingPlan
            };

        } catch (error) {
            console.error('Error updating tracking plan:', error);
            return {
                success: false,
                error: 'Internal server error'
            };
        }
    }

    static async deleteTrackingPlan(id: string): Promise<{ success: boolean; error?: string }> {
        try {
            const existingTrackingPlan = await prisma.trackingPlan.findFirst({
                where: {
                    id,
                    deletedAt: null
                }
            });

            if (!existingTrackingPlan) {
                return {
                    success: false,
                    error: 'Tracking plan not found'
                };
            }

            await prisma.trackingPlan.update({
                where: { id },
                data: {
                    deletedAt: new Date()
                }
            });

            return {
                success: true
            };

        } catch (error) {
            console.error('Error deleting tracking plan:', error);
            return {
                success: false,
                error: 'Internal server error'
            };
        }
    }
}