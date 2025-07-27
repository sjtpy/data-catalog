import { EventType, ApiResponse } from '../types';
import prisma from './prisma';

export class EventService {
    static async createEvent(data: {
        name: string;
        type: string;
        description: string;
        propertyIds?: string[];
    }): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            // Validation
            if (!data.name || !data.type || !data.description) {
                return {
                    success: false,
                    error: 'Missing required fields: name, type, and description are required'
                };
            }

            // Validate event type
            if (!Object.values(EventType).includes(data.type as EventType)) {
                return {
                    success: false,
                    error: `Invalid event type. Must be one of: ${Object.values(EventType).join(', ')}`
                };
            }

            // Create event using Prisma
            const event = await prisma.event.create({
                data: {
                    name: data.name,
                    type: data.type,
                    description: data.description,
                    propertyIds: data.propertyIds || []
                }
            });

            return {
                success: true,
                data: event
            };

        } catch (error) {
            console.error('Error creating event:', error);
            return {
                success: false,
                error: 'Internal server error'
            };
        }
    }

    static async getAllEvents(): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const events = await prisma.event.findMany({
                where: {
                    deletedAt: null
                },
                orderBy: {
                    createTime: 'desc'
                }
            });

            return {
                success: true,
                data: events
            };

        } catch (error) {
            console.error('Error fetching events:', error);
            return {
                success: false,
                error: 'Internal server error'
            };
        }
    }

    static async getEventById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const event = await prisma.event.findFirst({
                where: {
                    id,
                    deletedAt: null
                }
            });

            if (!event) {
                return {
                    success: false,
                    error: 'Event not found'
                };
            }

            return {
                success: true,
                data: event
            };

        } catch (error) {
            console.error('Error fetching event:', error);
            return {
                success: false,
                error: 'Internal server error'
            };
        }
    }
} 