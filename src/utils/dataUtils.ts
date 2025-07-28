import prisma from '../services/prisma';

/**
 * Filters out deleted property IDs from an array of property IDs
 */
export async function filterValidPropertyIds(propertyIds: string[]): Promise<string[]> {
    if (!propertyIds || propertyIds.length === 0) {
        return [];
    }

    const validProperties = await prisma.property.findMany({
        where: {
            id: { in: propertyIds },
            deletedAt: null
        }
    });

    return validProperties.map(p => p.id);
}

/**
 * Processes property data and returns property IDs, creating properties if they don't exist
 */
export async function processPropertyData(properties: { name: string; type: string; description: string }[]): Promise<string[]> {
    const propertyIds: string[] = [];

    for (const propertyData of properties) {
        if (!propertyData.name || !propertyData.type || !propertyData.description) {
            throw new Error('Property name, type, and description are required');
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
                throw new Error(`Property '${propertyData.name}' of type '${propertyData.type}' already exists with a different description`);
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

    return propertyIds;
} 