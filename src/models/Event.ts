import { BaseModel } from './BaseModel';
import { EventType } from '../types';

export class Event extends BaseModel {
    name: string;
    type: EventType;
    description: string;
    propertyIds: string[];

    constructor(data: {
        name: string;
        type: EventType;
        description: string;
        propertyIds?: string[];
        id?: string;
        create_time?: Date;
        update_time?: Date;
    }) {
        super(data);
        this.name = data.name;
        this.type = data.type;
        this.description = data.description;
        this.propertyIds = data.propertyIds || [];
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name,
            type: this.type,
            description: this.description,
            propertyIds: this.propertyIds
        };
    }
} 