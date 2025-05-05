import express from 'express';
import { getAllVenues, getVenue, createVenue, deleteVenue, updateVenue } from '../controllers/venueController.js';

const router = express.Router();

/**
 * @swagger
 * /api/venues:
 *   get:
 *     summary: Get all venues
 *     tags: [Venues]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter venues by location
 *     responses:
 *       200:
 *         description: List of venues
 *       500:
 *         description: Server error
 */
router.get('/', getAllVenues);

/**
 * @swagger
 * /api/venues/{id}:
 *   get:
 *     summary: Get a specific venue
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Venue ID
 *     responses:
 *       200:
 *         description: Venue details
 *       404:
 *         description: Venue not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getVenue);

/**
 * @swagger
 * /api/venues:
 *   post:
 *     summary: Create a new venue
 *     tags: [Venues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *               - dayPrice
 *               - nightPrice
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               dayPrice:
 *                 type: number
 *               nightPrice:
 *                 type: number
 *               capacity:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               coordinates:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *     responses:
 *       201:
 *         description: Venue created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', createVenue);

/**
 * @swagger
 * /api/venues/{id}:
 *   delete:
 *     summary: Delete a venue
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Venue ID
 *     responses:
 *       200:
 *         description: Venue deleted successfully
 *       404:
 *         description: Venue not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', deleteVenue);

/**
 * @swagger
 * /api/venues/{id}:
 *   put:
 *     summary: Update a venue
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Venue ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               dayPrice:
 *                 type: number
 *               nightPrice:
 *                 type: number
 *               capacity:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               coordinates:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *     responses:
 *       200:
 *         description: Venue updated successfully
 *       404:
 *         description: Venue not found
 *       500:
 *         description: Server error
 */
router.put('/:id', updateVenue);

export default router;