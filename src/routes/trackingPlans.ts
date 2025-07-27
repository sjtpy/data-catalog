import express from 'express';
import { ApiResponse } from '../types';
import { TrackingPlanService } from '../services/trackingPlanService';

const router = express.Router();

router.post('/', async (req, res, next) => {
    try {
        const { name, description, events } = req.body;

        const trackingPlan = await TrackingPlanService.createTrackingPlan({
            name,
            description,
            events
        });

        res.status(201).json({
            success: true,
            data: trackingPlan,
            message: 'Tracking plan created successfully'
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
});

router.get('/', async (req, res, next) => {
    try {
        const trackingPlans = await TrackingPlanService.getAllTrackingPlans();

        res.json({
            success: true,
            data: trackingPlans
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const trackingPlan = await TrackingPlanService.getTrackingPlanById(id);

        res.json({
            success: true,
            data: trackingPlan
        } as ApiResponse);
    } catch (error) {
        next(error);
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