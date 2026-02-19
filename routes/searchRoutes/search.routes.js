/**
 * Search Routes
 * Defines API endpoints for product search and filtering
 */

const express = require('express');
const router = express.Router();
const searchController = require('../../controllers/searchControllers/search.controller');
const { optionalAuthenticate } = require('../../middlewares/auth.middleware');

/**
 * @route   GET /api/search
 * @desc    Advanced product search with filters
 * @access  Public (optionally authenticated for history)
 * @query   q, category, minPrice, maxPrice, minRating, brands, sortBy, page, limit
 */
router.get('/', optionalAuthenticate, searchController.searchProducts);

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search autocomplete suggestions
 * @access  Public
 * @query   q, limit
 */
router.get('/suggestions', searchController.getSearchSuggestions);

/**
 * @route   GET /api/search/popular
 * @desc    Get popular search queries
 * @access  Public
 * @query   limit
 */
router.get('/popular', searchController.getPopularSearches);

/**
 * @route   GET /api/search/recent
 * @desc    Get user's recent searches
 * @access  Private
 * @query   limit
 */
router.get('/recent', optionalAuthenticate, searchController.getRecentSearches);

/**
 * @route   GET /api/search/filters
 * @desc    Get available filter options
 * @access  Public
 * @query   q, category
 */
router.get('/filters', searchController.getFilterOptions);

/**
 * @route   GET /api/search/price-ranges
 * @desc    Get predefined price range options
 * @access  Public
 */
router.get('/price-ranges', searchController.getPriceRanges);

/**
 * @route   GET /api/search/rating-options
 * @desc    Get rating filter options
 * @access  Public
 */
router.get('/rating-options', searchController.getRatingOptions);

/**
 * @route   GET /api/search/trending
 * @desc    Get trending products based on search analytics
 * @access  Public
 * @query   limit, days
 */
router.get('/trending', searchController.getTrendingProducts);

/**
 * @route   GET /api/search/popular-terms
 * @desc    Get popular search terms with statistics
 * @access  Public
 * @query   limit, days
 */
router.get('/popular-terms', searchController.getPopularSearchTerms);

/**
 * @route   GET /api/search/no-results
 * @desc    Get searches that returned no results
 * @access  Public
 * @query   limit, days
 */
router.get('/no-results', searchController.getNoResultSearches);

/**
 * @route   GET /api/search/analytics
 * @desc    Get search analytics summary
 * @access  Public
 * @query   days
 */
router.get('/analytics', searchController.getSearchAnalytics);

/**
 * @route   GET /api/search/related
 * @desc    Get related search queries
 * @access  Public
 * @query   q, limit
 */
router.get('/related', searchController.getRelatedSearches);

/**
 * @route   GET /api/search/spell-check
 * @desc    Get spelling correction suggestions
 * @access  Public
 * @query   q, maxDistance
 */
router.get('/spell-check', searchController.getSpellingSuggestions);

/**
 * @route   GET /api/search/alternatives
 * @desc    Get alternative search suggestions
 * @access  Public
 * @query   q
 */
router.get('/alternatives', searchController.getAlternativeSuggestions);

module.exports = router;
