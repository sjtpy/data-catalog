import express from 'express';
import { ApiResponse } from '../types';
import { PropertyService } from '../services/propertyService';

const router = express.Router();

router.post('/', async (req, res, next) => {
    try {
        const { name, type, description } = req.body;

        const property = await PropertyService.createProperty({
            name,
            type,
            description
        });

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
        const { id } = req.params;

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
        const { id } = req.params;
        const { name, type, description } = req.body;

        const updatedProperty = await PropertyService.updateProperty(id, {
            name,
            type,
            description
        });

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
        const { id } = req.params;

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