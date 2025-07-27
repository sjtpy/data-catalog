import { v4 as uuidv4 } from 'uuid';

export abstract class BaseModel {
    id: string;
    create_time: Date;
    update_time: Date;
    deleted_at: Date | null;

    constructor(data?: {
        id?: string;
        create_time?: Date;
        update_time?: Date;
        deleted_at?: Date | null;
    }) {
        this.id = data?.id || this.generateId();
        this.create_time = data?.create_time || new Date();
        this.update_time = data?.update_time || new Date();
        this.deleted_at = data?.deleted_at ?? null;
    }

    private generateId(): string {
        return uuidv4();
    }

    update(): void {
        this.update_time = new Date();
    }

    delete(): void {
        this.deleted_at = new Date();
    }

    toJSON() {
        return {
            id: this.id,
            create_time: this.create_time,
            update_time: this.update_time,
            deleted_at: this.deleted_at
        };
    }
} 