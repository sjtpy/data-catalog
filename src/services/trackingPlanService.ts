import { CreateTrackingPlanPayload, TrackingPlanEventData, TrackingPlanPropertyInput } from '../types/trackingPlanTypes';
import { EventType } from '../types/eventTypes';
import { BadRequestError, ConflictError, InternalServerError, NotFoundError, HttpError } from '../utils/exceptions';
import { TrackingPlanRepository } from '../repositories/trackingPlanRepository';
import { processEventData, filterValidEventIds } from '../utils/dataUtils';

export class TrackingPlanService {
    private static trackingPlanRepository = new TrackingPlanRepository();

    static async createTrackingPlan(data: CreateTrackingPlanPayload): Promise<any> {
        // Validation
        if (!data.name || !data.description) {
            throw new BadRequestError('Missing required fields: name and description are required');
        }

        if (!data.events || data.events.length === 0) {
            throw new BadRequestError('At least one event is required to create a tracking plan.');
        }

        // Check for unique tracking plan name
        const existingTrackingPlan = await this.trackingPlanRepository.findByName(data.name);

        if (existingTrackingPlan) {
            throw new ConflictError(`Tracking plan with name '${data.name}' already exists`);
        }

        try {
            // Process events and get event IDs
            const eventIds = await processEventData(data.events);

            // Create tracking plan
            const trackingPlan = await this.trackingPlanRepository.create({
                name: data.name,
                description: data.description,
                eventIds
            });

            return trackingPlan;
        } catch (error: any) {
            console.error('Error creating tracking plan:', error);

            if (error instanceof HttpError) {
                throw error;
            }

            if (error.message) {
                throw new BadRequestError(error.message);
            }

            throw new InternalServerError('Failed to create tracking plan');
        }
    }

    static async getAllTrackingPlans(): Promise<any[]> {
        try {
            const trackingPlans = await this.trackingPlanRepository.findAll();

            // Filter out deleted event IDs and their deleted property IDs from each tracking plan
            const trackingPlansWithValidData = await Promise.all(
                trackingPlans.map(async (trackingPlan: any) => {
                    if (trackingPlan.eventIds && trackingPlan.eventIds.length > 0) {
                        const validEventIds = await filterValidEventIds(trackingPlan.eventIds);
                        return { ...trackingPlan, eventIds: validEventIds };
                    }
                    return trackingPlan;
                })
            );

            return trackingPlansWithValidData;
        } catch (error: any) {
            console.error('Error fetching tracking plans:', error);
            throw new InternalServerError('Failed to fetch tracking plans');
        }
    }

    static async getTrackingPlanById(id: string): Promise<any> {
        try {
            const trackingPlan = await this.trackingPlanRepository.findById(id);

            if (!trackingPlan) {
                throw new NotFoundError('Tracking plan not found');
            }

            // Filter out deleted event IDs and their deleted property IDs from the tracking plan
            if (trackingPlan.eventIds && trackingPlan.eventIds.length > 0) {
                const validEventIds = await filterValidEventIds(trackingPlan.eventIds);
                return { ...trackingPlan, eventIds: validEventIds };
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
            const existingTrackingPlan = await this.trackingPlanRepository.findById(id);

            if (!existingTrackingPlan) {
                throw new NotFoundError('Tracking plan not found');
            }

            // Check for unique name
            if (data.name && data.name !== existingTrackingPlan.name) {
                const duplicateName = await this.trackingPlanRepository.findByName(data.name);

                if (duplicateName) {
                    throw new ConflictError(`Tracking plan with name '${data.name}' already exists`);
                }
            }

            let eventIds: string[] = existingTrackingPlan.eventIds;

            // Filter out deleted event IDs from existing events
            if (eventIds.length > 0) {
                const validEvents = await this.trackingPlanRepository.findManyByIds(eventIds);
                eventIds = validEvents.map(e => e.id);
            }

            if (data.events && data.events.length > 0) {
                // Fetch all existing events for this tracking plan (using filtered eventIds)
                const existingEvents = await this.trackingPlanRepository.findManyByIds(eventIds);

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
                            await this.trackingPlanRepository.updateEventDescription(existingEvent.id, eventData.description);
                        }
                        eventId = existingEvent.id;
                    } else {
                        // Check if event exists globally (not in this plan)
                        const globalEvent = await this.trackingPlanRepository.findByNameAndType(eventData.name, eventData.type);
                        if (globalEvent) {
                            if (globalEvent.description !== eventData.description) {
                                throw new ConflictError(`Event '${eventData.name}' already exists with a different description`);
                            }
                            eventId = globalEvent.id;
                        } else {

                            const newEvent = await this.trackingPlanRepository.createEvent({
                                name: eventData.name,
                                type: eventData.type,
                                description: eventData.description,
                                propertyIds: []
                            });
                            eventId = newEvent.id;
                        }
                        newEventIds.push(eventId);
                    }


                    if (eventData.properties && eventData.properties.length > 0) {
                        const propertyIds: string[] = [];
                        for (const propertyData of eventData.properties) {
                            if (!propertyData.name || !propertyData.type || !propertyData.description) {
                                throw new BadRequestError(`Property name, type, and description are required for event '${eventData.name}'`);
                            }

                            const existingProperty = await this.trackingPlanRepository.findByNameAndType(propertyData.name, propertyData.type);
                            let propertyId: string;
                            if (existingProperty) {
                                if (existingProperty.description !== propertyData.description) {
                                    throw new ConflictError(`Property '${propertyData.name}' of type '${propertyData.type}' already exists with a different description`);
                                }
                                propertyId = existingProperty.id;
                            } else {
                                const newProperty = await this.trackingPlanRepository.createProperty({
                                    name: propertyData.name,
                                    type: propertyData.type,
                                    description: propertyData.description
                                });
                                propertyId = newProperty.id;
                            }
                            propertyIds.push(propertyId);
                        }

                        await this.trackingPlanRepository.updateEventProperties(eventId, propertyIds);
                    }
                }

                eventIds = Array.from(new Set(newEventIds));
            }

            const updatedTrackingPlan = await this.trackingPlanRepository.update(id, {
                ...(data.name && { name: data.name }),
                ...(data.description && { description: data.description }),
                ...(data.events && { eventIds })
            });

            return updatedTrackingPlan;

        } catch (error: any) {
            console.error('Error updating tracking plan:', error);

            if (error instanceof HttpError) {
                throw error;
            }

            throw new InternalServerError('Failed to update tracking plan');
        }
    }

    static async deleteTrackingPlan(id: string): Promise<{ success: boolean }> {
        try {
            const existingTrackingPlan = await this.trackingPlanRepository.findById(id);

            if (!existingTrackingPlan) {
                throw new NotFoundError('Tracking plan not found');
            }

            await this.trackingPlanRepository.softDelete(id);

            return { success: true };
        } catch (error: any) {
            console.error('Error deleting tracking plan:', error);

            if (error instanceof HttpError) {
                throw error;
            }

            throw new InternalServerError('Failed to delete tracking plan');
        }
    }
}