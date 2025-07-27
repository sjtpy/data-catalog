import { BaseModel } from './BaseModel';
import { PropertyType } from '../types';

export class Property extends BaseModel {
    name: string;
    type: PropertyType;
    description: string;

    constructor(data: {
        name: string;
        type: PropertyType;
        description: string;
        id?: string;
        create_time?: Date;
        update_time?: Date;
    }) {
        super(data);
        this.name = data.name;
        this.type = data.type;
        this.description = data.description;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name,
            type: this.type,
            description: this.description
        };
    }
} 