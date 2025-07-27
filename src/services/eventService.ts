import { EventType } from '../types';
import { BadRequestError, ConflictError, InternalServerError, NotFoundError, HttpError } from '../utils/exceptions';
import prisma from './prisma';

export class EventService {
    static async createEvent(data: {
        name: string;
        type: string;
        description: string;
        propertyIds?: string[];
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

        try {
            const event = await prisma.event.create({
                data: {
                    name: data.name,
                    type: data.type,
                    description: data.description,
                    propertyIds: data.propertyIds || []
                }
            });

            return event;
        } catch (error) {
            console.error('Error creating event:', error);
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
            console.error('Error fetching event:', error);
            throw new InternalServerError('Failed to fetch event');
        }
    }
} 