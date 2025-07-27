import express from 'express';
import { ApiResponse } from '../types';
import { PropertyService } from '../services/propertyService';

const router = express.Router();

router.post('/', async (req, res) => {
    const { name, type, description } = req.body;

    const result = await PropertyService.createProperty({
        name,
        type,
        description
    });

    if (result.success) {
        res.status(201).json({
            success: true,
            data: result.data,
            message: 'Property created successfully'
        } as ApiResponse);
    } else {
        res.status(400).json({
            success: false,
            error: result.error
        } as ApiResponse);
    }
});

router.get('/', async (req, res) => {
    const result = await PropertyService.getAllProperties();

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

    const result = await PropertyService.getPropertyById(id);

    if (result.success) {
        res.json({
            success: true,
            data: result.data
        } as ApiResponse);
    } else {
        const statusCode = result.error === 'Property not found' ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: result.error
        } as ApiResponse);
    }
});

export default router; 