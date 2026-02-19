/**
 * Brand Routes
 * Defines API endpoints for brand management
 */

const express = require('express');
const router = express.Router();
const searchController = require('../../controllers/searchControllers/search.controller');

/**
 * @route   GET /api/brands
 * @desc    Get all active brands
 * @access  Public
 */
router.get('/', searchController.getAllBrands);

module.exports = router;
