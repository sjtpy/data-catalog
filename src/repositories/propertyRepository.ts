import prisma from '../services/prisma';

export class PropertyRepository {
    async create(data: {
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

    async findById(id: string): Promise<any | null> {
        return await prisma.property.findFirst({
            where: {
                id,
                deletedAt: null
            }
        });
    }

    async findAll(): Promise<any[]> {
        return await prisma.property.findMany({
            where: {
                deletedAt: null
            },
            orderBy: {
                createTime: 'desc'
            }
        });
    }

    async findByNameAndType(name: string, type: string): Promise<any | null> {
        return await prisma.property.findFirst({
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
    }): Promise<any> {
        return await prisma.property.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.type && { type: data.type }),
                ...(data.description && { description: data.description }),
                updateTime: new Date()
            }
        });
    }

    async softDelete(id: string): Promise<void> {
        await prisma.property.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updateTime: new Date()
            }
        });
    }

    async findByIds(ids: string[]): Promise<any[]> {
        return await prisma.property.findMany({
            where: {
                id: { in: ids },
                deletedAt: null
            }
        });
    }
} 