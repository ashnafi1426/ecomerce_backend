/**
 * Search Controller
 * Handles HTTP requests for product search and filtering
 */

const searchService = require('../../services/searchServices/search.service');
const filterService = require('../../services/searchServices/filter.service');
const analyticsService = require('../../services/searchServices/analytics.service');
const spellCheckService = require('../../services/searchServices/spell-check.service');

class SearchController {
  /**
   * Advanced product search
   * GET /api/search
   */
  async searchProducts(req, res) {
    try {
      const {
        q: query = '',
        category = null,
        minPrice = null,
        maxPrice = null,
        minRating = null,
        brands = '',
        sortBy = 'relevance',
        sortOrder = 'asc',
        page = 1,
        limit = 20
      } = req.query;

      // Parse brands array
      const brandsArray = brands ? brands.split(',').filter(Boolean) : [];

      // Build search params
      const searchParams = {
        query,
        category,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        minRating: minRating ? parseFloat(minRating) : null,
        brands: brandsArray,
        sortBy,
        sortOrder,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      // Perform search
      const result = await searchService.searchProducts(searchParams);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Search failed',
          error: result.error
        });
      }
      // Save search history (if user is authenticated)
      if (req.user && query) {
        await searchService.saveSearchHistory(
          req.user.id,
          query,
          result.data.pagination.total,
          { category, minPrice, maxPrice, minRating, brands: brandsArray }
        );
      }

      // Flatten response for easier frontend access
      return res.status(200).json({
        success: true,
        products: result.data.products,
        pagination: result.data.pagination,
        total: result.data.pagination.total,
        page: result.data.pagination.page,
        limit: result.data.pagination.limit
      });

    } catch (error) {
      console.error('Search controller error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get search suggestions/autocomplete
   * GET /api/search/suggestions
   */
  async getSearchSuggestions(req, res) {
    try {
      const { q: query = '', limit = 10 } = req.query;

      const result = await searchService.getSearchSuggestions(
        query,
        parseInt(limit) || 10
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get suggestions',
          error: result.error
        });
      }

      return res.status(200).json({
        success: true,
        suggestions: result.data.suggestions
      });

    } catch (error) {
      console.error('Suggestions controller error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get popular searches
   * GET /api/search/popular
   */
  async getPopularSearches(req, res) {
    try {
      const { limit = 10 } = req.query;

      const result = await searchService.getPopularSearches(
        parseInt(limit) || 10
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get popular searches',
          error: result.error
        });
      }

      return res.status(200).json({
        success: true,
        popular: result.data.popularSearches
      });

    } catch (error) {
      console.error('Popular searches controller error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get user's recent searches
   * GET /api/search/recent
   */
  async getRecentSearches(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { limit = 10 } = req.query;

      const result = await searchService.getRecentSearches(
        req.user.id,
        parseInt(limit) || 10
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get recent searches',
          error: result.error
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('Recent searches controller error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get available filter options
   * GET /api/search/filters
   */
  async getFilterOptions(req, res) {
    try {
      const { q: query = '', category = null } = req.query;

      const result = await filterService.getFilterOptions({ query, category });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get filter options',
          error: result.error
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('Filter options controller error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get all brands
   * GET /api/brands
   */
  async getAllBrands(req, res) {
    try {
      const result = await filterService.getAllBrands();

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get brands',
          error: result.error
        });
      }

      return res.status(200).json({
        success: true,
        brands: result.data.brands || []
      });

    } catch (error) {
      console.error('Get brands controller error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get price ranges
   * GET /api/search/price-ranges
   */
  getPriceRanges(req, res) {
    try {
      const result = filterService.getPriceRanges();
      return res.status(200).json(result);
    } catch (error) {
      console.error('Get price ranges error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get rating options
   * GET /api/search/rating-options
   */
  getRatingOptions(req, res) {
    try {
      const result = filterService.getRatingOptions();
      return res.status(200).json(result);
    } catch (error) {
      console.error('Get rating options error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get trending products
   * GET /api/search/trending
   */
  async getTrendingProducts(req, res) {
    try {
      const { limit = 10, days = 7 } = req.query;

      const result = await analyticsService.getTrendingProducts(
        parseInt(limit) || 10,
        parseInt(days) || 7
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get trending products',
          error: result.error
        });
      }

      return res.status(200).json({
        success: true,
        trending: result.data.trending || result.data.products || []
      });

    } catch (error) {
      console.error('Get trending products error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get popular search terms with statistics
   * GET /api/search/popular-terms
   */
  async getPopularSearchTerms(req, res) {
    try {
      const { limit = 10, days = 30 } = req.query;

      const result = await analyticsService.getPopularSearchTerms(
        parseInt(limit) || 10,
        parseInt(days) || 30
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get popular search terms',
          error: result.error
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('Get popular search terms error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get searches with no results
   * GET /api/search/no-results
   */
  async getNoResultSearches(req, res) {
    try {
      const { limit = 20, days = 30 } = req.query;

      const result = await analyticsService.getNoResultSearches(
        parseInt(limit) || 20,
        parseInt(days) || 30
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get no-result searches',
          error: result.error
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('Get no-result searches error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get search analytics summary
   * GET /api/search/analytics
   */
  async getSearchAnalytics(req, res) {
    try {
      const { days = 30 } = req.query;

      const result = await analyticsService.getSearchAnalyticsSummary(
        parseInt(days) || 30
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get search analytics',
          error: result.error
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('Get search analytics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get related searches
   * GET /api/search/related
   */
  async getRelatedSearches(req, res) {
    try {
      const { q: query = '', limit = 5 } = req.query;

      const result = await analyticsService.getRelatedSearches(
        query,
        parseInt(limit) || 5
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get related searches',
          error: result.error
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('Get related searches error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get spelling suggestions for query
   * GET /api/search/spell-check
   */
  async getSpellingSuggestions(req, res) {
    try {
      const { q: query = '', maxDistance = 2 } = req.query;

      const result = await spellCheckService.getSpellingSuggestions(
        query,
        parseInt(maxDistance) || 2
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get spelling suggestions',
          error: result.error
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('Get spelling suggestions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get alternative search suggestions
   * GET /api/search/alternatives
   */
  async getAlternativeSuggestions(req, res) {
    try {
      const { q: query = '' } = req.query;

      const result = await spellCheckService.getAlternativeSuggestions(query);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get alternative suggestions',
          error: result.error
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('Get alternative suggestions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new SearchController();
