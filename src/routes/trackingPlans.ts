import express from 'express';
import { ApiResponse } from '../types';
import { TrackingPlanService } from '../services/trackingPlanService';
import {
    validateCreateTrackingPlanRequest,
    validateUpdateTrackingPlanRequest,
    validateTrackingPlanParams
} from '../validators';

const router = express.Router();

router.post('/', async (req, res, next) => {
    try {
        const validatedData = validateCreateTrackingPlanRequest(req.body);

        const trackingPlan = await TrackingPlanService.createTrackingPlan(validatedData);

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
        const { id } = validateTrackingPlanParams(req.params);

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
        const { id } = validateTrackingPlanParams(req.params);
        const validatedData = validateUpdateTrackingPlanRequest(req.body);

        const updatedTrackingPlan = await TrackingPlanService.updateTrackingPlan(id, validatedData);

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
        const { id } = validateTrackingPlanParams(req.params);

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