import prisma from '../services/prisma';

export class EventRepository {
    async create(data: {
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

    async findById(id: string): Promise<any | null> {
        return await prisma.event.findFirst({
            where: {
                id,
                deletedAt: null
            }
        });
    }

    async findAll(): Promise<any[]> {
        return await prisma.event.findMany({
            where: {
                deletedAt: null
            },
            orderBy: {
                createTime: 'desc'
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

    async update(id: string, data: {
        name?: string;
        type?: string;
        description?: string;
        propertyIds?: string[];
    }): Promise<any> {
        return await prisma.event.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.type && { type: data.type }),
                ...(data.description && { description: data.description }),
                ...(data.propertyIds && { propertyIds: data.propertyIds }),
                updateTime: new Date()
            }
        });
    }

    async softDelete(id: string): Promise<void> {
        await prisma.event.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updateTime: new Date()
            }
        });
    }

    // Helper method to find properties by IDs (for filtering deleted properties)
    async findPropertiesByIds(propertyIds: string[]): Promise<any[]> {
        return await prisma.property.findMany({
            where: {
                id: { in: propertyIds },
                deletedAt: null
            }
        });
    }

    // Helper method to create property (for event creation with new properties)
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

    // Helper method to find property by name and type
    async findPropertyByNameAndType(name: string, type: string): Promise<any | null> {
        return await prisma.property.findFirst({
            where: {
                name,
                type,
                deletedAt: null
            }
        });
    }
} 