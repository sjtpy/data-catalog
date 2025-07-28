import prisma from '../services/prisma';


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


export async function filterValidEventIds(eventIds: string[]): Promise<string[]> {
    if (!eventIds || eventIds.length === 0) {
        return [];
    }

    const validEvents = await prisma.event.findMany({
        where: {
            id: { in: eventIds },
            deletedAt: null
        }
    });

    return validEvents.map(e => e.id);
}


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


export async function processEventData(events: { name: string; type: string; description: string; properties?: { name: string; type: string; description: string }[] }[]): Promise<string[]> {
    const eventIds: string[] = [];

    for (const eventData of events) {
        if (!eventData.name || !eventData.type || !eventData.description) {
            throw new Error('Event name, type, and description are required');
        }

        const existingEvent = await prisma.event.findFirst({
            where: {
                name: eventData.name,
                type: eventData.type,
                deletedAt: null
            }
        });

        let eventId: string;
        if (existingEvent) {
            if (existingEvent.description !== eventData.description) {
                throw new Error(`Event '${eventData.name}' already exists with a different description`);
            }
            eventId = existingEvent.id;
        } else {
            // Process properties for new event
            let propertyIds: string[] = [];
            if (eventData.properties && eventData.properties.length > 0) {
                propertyIds = await processPropertyData(eventData.properties);
            }

            const newEvent = await prisma.event.create({
                data: {
                    name: eventData.name,
                    type: eventData.type,
                    description: eventData.description,
                    propertyIds
                }
            });
            eventId = newEvent.id;
        }
        eventIds.push(eventId);
    }

    return eventIds;
} 