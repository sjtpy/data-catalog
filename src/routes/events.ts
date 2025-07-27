import express from 'express';
import { ApiResponse } from '../types';
import { EventService } from '../services/eventService';

const router = express.Router();

router.post('/', async (req, res) => {
    const { name, type, description, propertyIds } = req.body;

    const result = await EventService.createEvent({
        name,
        type,
        description,
        propertyIds
    });

    if (result.success) {
        res.status(201).json({
            success: true,
            data: result.data,
            message: 'Event created successfully'
        } as ApiResponse);
    } else {
        res.status(400).json({
            success: false,
            error: result.error
        } as ApiResponse);
    }
});

router.get('/', async (req, res) => {
    const result = await EventService.getAllEvents();

    if (result.success) {
        res.json({
            success: true,
            data: result.data
        } as ApiResponse);
    } else {
        res.status(500).json({
            success: false,
            error: result.error
        } as ApiResponse);
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const result = await EventService.getEventById(id);

    if (result.success) {
        res.json({
            success: true,
            data: result.data
        } as ApiResponse);
    } else {
        const statusCode = result.error === 'Event not found' ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: result.error
        } as ApiResponse);
    }
});

export default router; 