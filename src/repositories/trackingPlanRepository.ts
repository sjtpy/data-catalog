import prisma from '../services/prisma';

export class TrackingPlanRepository {
    async create(data: {
        name: string;
        description: string;
        eventIds: string[];
    }): Promise<any> {
        return await prisma.trackingPlan.create({
            data: {
                name: data.name,
                description: data.description,
                eventIds: data.eventIds
            }
        });
    }

    async findById(id: string): Promise<any | null> {
        return await prisma.trackingPlan.findFirst({
            where: {
                id,
                deletedAt: null
            }
        });
    }

    async findAll(): Promise<any[]> {
        return await prisma.trackingPlan.findMany({
            where: {
                deletedAt: null
            },
            orderBy: {
                createTime: 'desc'
            }
        });
    }

    async findByName(name: string): Promise<any | null> {
        return await prisma.trackingPlan.findFirst({
            where: {
                name,
                deletedAt: null
            }
        });
    }

    async update(id: string, data: {
        name?: string;
        description?: string;
        eventIds?: string[];
    }): Promise<any> {
        return await prisma.trackingPlan.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.description && { description: data.description }),
                ...(data.eventIds && { eventIds: data.eventIds }),
                updateTime: new Date()
            }
        });
    }

    async softDelete(id: string): Promise<void> {
        await prisma.trackingPlan.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updateTime: new Date()
            }
        });
    }

    // Helper methods for complex operations
    async findManyByIds(ids: string[]): Promise<any[]> {
        return await prisma.event.findMany({
            where: {
                id: { in: ids },
                deletedAt: null
            }
        });
    }

    async findByNameAndType(name: string, type: string): Promise<any | null> {
        return await prisma.event.findFirst({
            where: {
                name,
                type,
                deletedAt: null
            }
        });
    }

    async createEvent(data: {
        name: string;
        type: string;
        description: string;
        propertyIds: string[];
    }): Promise<any> {
        return await prisma.event.create({
            data: {
                name: data.name,
                type: data.type,
                description: data.description,
                propertyIds: data.propertyIds
            }
        });
    }

    async updateEventDescription(eventId: string, description: string): Promise<any> {
        return await prisma.event.update({
            where: { id: eventId },
            data: { description }
        });
    }

    async updateEventProperties(eventId: string, propertyIds: string[]): Promise<any> {
        return await prisma.event.update({
            where: { id: eventId },
            data: { propertyIds }
        });
    }

    async createProperty(data: {
        name: string;
        type: string;
        description: string;
    }): Promise<any> {
        return await prisma.property.create({
            data: {
                name: data.name,
                type: data.type,
                description: data.description
            }
        });
    }
} 