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

router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, events } = req.body;

        const updatedTrackingPlan = await TrackingPlanService.updateTrackingPlan(id, {
            name,
            description,
            events
        });

        res.json({
            success: true,
            data: updatedTrackingPlan,
            message: 'Tracking plan updated successfully'
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        await TrackingPlanService.deleteTrackingPlan(id);

        res.json({
            success: true,
            message: 'Tracking plan deleted successfully'
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
});

export default router;