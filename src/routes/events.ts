import express from 'express';
import { ApiResponse } from '../types';
import { EventService } from '../services/eventService';
import { HttpError } from '../utils/exceptions';

const router = express.Router();

router.post('/', async (req, res, next) => {
    try {
        const { name, type, description, properties } = req.body;

        const event = await EventService.createEvent({
            name,
            type,
            description,
            properties
        });

        res.status(201).json({
            success: true,
            data: event,
            message: 'Event created successfully'
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
});

router.get('/', async (req, res, next) => {
    try {
        const events = await EventService.getAllEvents();

        res.json({
            success: true,
            data: events
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const event = await EventService.getEventById(id);

        res.json({
            success: true,
            data: event
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, type, description, properties } = req.body;

        const updatedEvent = await EventService.updateEvent(id, {
            name,
            type,
            description,
            properties
        });

        res.json({
            success: true,
            data: updatedEvent,
            message: 'Event updated successfully'
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
});

export default router; 