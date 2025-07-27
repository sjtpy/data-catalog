import { BaseModel } from './BaseModel';

export class TrackingPlan extends BaseModel {
    name: string;
    description: string;
    eventIds: string[];

    constructor(data: {
        name: string;
        description: string;
        eventIds?: string[];
        id?: string;
        create_time?: Date;
        update_time?: Date;
    }) {
        super(data);
        this.name = data.name;
        this.description = data.description;
        this.eventIds = data.eventIds || [];
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name,
            description: this.description,
            eventIds: this.eventIds
        };
    }
} 