import { BadRequestError, ConflictError, InternalServerError, NotFoundError, HttpError } from '../utils/exceptions';
import { EventRepository } from '../repositories/eventRepository';
import { filterValidPropertyIds, processPropertyData } from '../utils/dataUtils';

export class EventService {
    private static eventRepository = new EventRepository();

    static async createEvent(data: {
        name: string;
        type: string;
        description: string;
        properties?: { name: string; type: string; description: string }[];
    }): Promise<any> {
        // Check for unique name and type
        const existingEvent = await this.eventRepository.findByNameAndType(data.name, data.type);

        if (existingEvent) {
            throw new ConflictError(`Event with name '${data.name}' and type '${data.type}' already exists`);
        }

        let propertyIds: string[] = [];
        if (data.properties && data.properties.length > 0) {
            try {
                propertyIds = await processPropertyData(data.properties);
            } catch (error: any) {
                throw new BadRequestError(error.message);
            }
        }

        try {
            const event = await this.eventRepository.create({
                name: data.name,
                type: data.type,
                description: data.description,
                propertyIds
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
            const events = await this.eventRepository.findAll();

            // Filter out deleted property IDs from each event
            const eventsWithValidProperties = await Promise.all(
                events.map(async (event: any) => {
                    if (event.propertyIds && event.propertyIds.length > 0) {
                        const validPropertyIds = await filterValidPropertyIds(event.propertyIds);
                        return { ...event, propertyIds: validPropertyIds };
                    }
                    return event;
                })
            );

            return eventsWithValidProperties;
        } catch (error: any) {
            console.error('Error fetching events:', error);
            throw new InternalServerError('Failed to fetch events');
        }
    }

    static async getEventById(id: string): Promise<any> {
        try {
            const event = await this.eventRepository.findById(id);

            if (!event) {
                throw new NotFoundError('Event not found');
            }

            // Filter out deleted property IDs
            if (event.propertyIds && event.propertyIds.length > 0) {
                const validPropertyIds = await filterValidPropertyIds(event.propertyIds);
                return { ...event, propertyIds: validPropertyIds };
            }

            return event;
        } catch (error: any) {
            console.error('Error fetching event:', error);

            if (error instanceof HttpError) {
                throw error;
            }

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
            const existingEvent = await this.eventRepository.findById(id);

            if (!existingEvent) {
                throw new NotFoundError('Event not found');
            }



            // Check for unique name and type combination if name or type is being updated
            if (data.name || data.type) {
                const newName = data.name || existingEvent.name;
                const newType = data.type || existingEvent.type;

                const duplicateEvent = await this.eventRepository.findByNameAndType(newName, newType);

                if (duplicateEvent && duplicateEvent.id !== id) {
                    throw new ConflictError(`Event with name '${newName}' and type '${newType}' already exists`);
                }
            }

            let propertyIds: string[] = existingEvent.propertyIds || [];
            // Filter out deleted property IDs from existing properties
            if (propertyIds.length > 0) {
                propertyIds = await filterValidPropertyIds(propertyIds);
            }

            if (data.properties && data.properties.length > 0) {
                const newPropertyIds: string[] = [];
                for (const propertyData of data.properties) {
                    const existingProperty = await this.eventRepository.findPropertyByNameAndType(propertyData.name, propertyData.type);
                    let propertyId: string;
                    if (existingProperty) {
                        if (existingProperty.description !== propertyData.description) {
                            throw new ConflictError(`Property '${propertyData.name}' of type '${propertyData.type}' already exists with a different description`);
                        }
                        propertyId = existingProperty.id;
                    } else {
                        const newProperty = await this.eventRepository.createProperty({
                            name: propertyData.name,
                            type: propertyData.type,
                            description: propertyData.description
                        });
                        propertyId = newProperty.id;
                    }
                    newPropertyIds.push(propertyId);
                }
                // Merge and deduplicate for additive update
                propertyIds = Array.from(new Set([...propertyIds, ...newPropertyIds]));
            }

            const updatedEvent = await this.eventRepository.update(id, {
                ...(data.name && { name: data.name }),
                ...(data.type && { type: data.type }),
                ...(data.description && { description: data.description }),
                propertyIds
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

    static async deleteEvent(id: string): Promise<{ success: boolean }> {
        try {
            const existingEvent = await this.eventRepository.findById(id);

            if (!existingEvent) {
                throw new NotFoundError('Event not found');
            }

            await this.eventRepository.softDelete(id);

            return { success: true };
        } catch (error: any) {
            console.error('Error deleting event:', error);

            if (error instanceof HttpError) {
                throw error;
            }

            throw new InternalServerError('Failed to delete event');
        }
    }
} 