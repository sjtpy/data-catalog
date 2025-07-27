import { PropertyType } from './propertyTypes';
import { EventType } from './eventTypes';

export interface TrackingPlanPropertyInput {
    name: string;
    type: PropertyType;
    required: boolean;
    description: string;
}

export interface TrackingPlanEventData {
    name: string;
    type: EventType;
    description: string;
    properties: TrackingPlanPropertyInput[];
    additionalProperties: string;
}

export interface CreateTrackingPlanPayload {
    name: string;
    description: string;
    events: TrackingPlanEventData[];
} 