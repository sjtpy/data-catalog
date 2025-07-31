import express from 'express';
import { ApiResponse } from '../types';
import { PropertyService } from '../services/propertyService';
import {
    validateCreatePropertyRequest,
    validateUpdatePropertyRequest,
    validatePropertyParams
} from '../validators';

const router = express.Router();

router.post('/', async (req, res, next) => {
    try {
        const validatedData = validateCreatePropertyRequest(req.body);

        const property = await PropertyService.createProperty(validatedData);

        res.status(201).json({
            success: true,
            data: property,
            message: 'Property created successfully'
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
});

router.get('/', async (req, res, next) => {
    try {
        const properties = await PropertyService.getAllProperties();

        res.json({
            success: true,
            data: properties
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = validatePropertyParams(req.params);

        const property = await PropertyService.getPropertyById(id);

        res.json({
            success: true,
            data: property
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const { id } = validatePropertyParams(req.params);
        const validatedData = validateUpdatePropertyRequest(req.body);

        const updatedProperty = await PropertyService.updateProperty(id, validatedData);

        res.json({
            success: true,
            data: updatedProperty,
            message: 'Property updated successfully'
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = validatePropertyParams(req.params);

        await PropertyService.deleteProperty(id);

        res.json({
            success: true,
            message: 'Property deleted successfully'
        } as ApiResponse);
    } catch (error) {
        next(error);
    }
});

export default router; 