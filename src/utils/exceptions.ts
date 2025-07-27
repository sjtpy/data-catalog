export class HttpError extends Error {
    public statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
    }
}

export class BadRequestError extends HttpError {
    constructor(message: string) {
        super(400, message);
    }
}

export class NotFoundError extends HttpError {
    constructor(message: string) {
        super(404, message);
    }
}

export class ConflictError extends HttpError {
    constructor(message: string) {
        super(409, message);
    }
}

export class InternalServerError extends HttpError {
    constructor(message: string = 'Internal server error') {
        super(500, message);
    }
} 