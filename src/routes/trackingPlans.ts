import express from 'express';
import { ApiResponse } from '../types';
import { TrackingPlanService } from '../services/trackingPlanService';

const router = express.Router();

router.post('/', async (req, res) => {
    const { name, description, events } = req.body;

    const result = await TrackingPlanService.createTrackingPlan({
        name,
        description,
        events
    });

    if (result.success) {
        res.status(201).json({
            success: true,
            data: result.data,
            message: 'Tracking plan created successfully'
        } as ApiResponse);
    } else {
        res.status(400).json({
            success: false,
            error: result.error
        } as ApiResponse);
    }
});

router.get('/', async (req, res) => {
    const result = await TrackingPlanService.getAllTrackingPlans();

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

    const result = await TrackingPlanService.getTrackingPlanById(id);

    if (result.success) {
        res.json({
            success: true,
            data: result.data
        } as ApiResponse);
    } else {
        const statusCode = result.error === 'Tracking plan not found' ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: result.error
        } as ApiResponse);
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, eventIds } = req.body;

    const result = await TrackingPlanService.updateTrackingPlan(id, {
        name,
        description,
        eventIds
    });

    if (result.success) {
        res.json({
            success: true,
            data: result.data,
            message: 'Tracking plan updated successfully'
        } as ApiResponse);
    } else {
        const statusCode = result.error === 'Tracking plan not found' ? 404 : 400;
        res.status(statusCode).json({
            success: false,
            error: result.error
        } as ApiResponse);
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    const result = await TrackingPlanService.deleteTrackingPlan(id);

    if (result.success) {
        res.json({
            success: true,
            message: 'Tracking plan deleted successfully'
        } as ApiResponse);
    } else {
        const statusCode = result.error === 'Tracking plan not found' ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: result.error
        } as ApiResponse);
    }
});

export default router;