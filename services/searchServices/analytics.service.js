/**
 * Search Analytics Service
 * Tracks and analyzes search behavior for insights
 */

const supabase = require('../../config/supabase');

class AnalyticsService {
  /**
   * Get trending products based on search frequency
   * @param {number} limit - Number of trending products
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Trending products
   */
  async getTrendingProducts(limit = 10, days = 7) {
    try {
      // Calculate date threshold
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      // Get most searched products from search history
      const { data: searchData, error: searchError } = await supabase
        .from('search_history')
        .select('search_query')
        .gte('created_at', dateThreshold.toISOString())
        .order('created_at', { ascending: false });

      if (searchError) throw searchError;

      // Count search query frequencies
      const queryFrequency = {};
      searchData.forEach(item => {
        const query = item.search_query.toLowerCase().trim();
        if (query) {
          queryFrequency[query] = (queryFrequency[query] || 0) + 1;
        }
      });

      // Get top searched queries
      const topQueries = Object.entries(queryFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([query]) => query);

      if (topQueries.length === 0) {
        // If no search history, return featured products
        const { data: featuredProducts, error: featuredError } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'active')
          .eq('approval_status', 'approved')
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (featuredError) throw featuredError;

        return {
          success: true,
          data: {
            products: featuredProducts || [],
            message: 'Showing featured products'
          }
        };
      }

      // Find products matching top queries
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .eq('approval_status', 'approved')
        .or(topQueries.map(q => `title.ilike.%${q}%`).join(','))
        .order('average_rating', { ascending: false })
        .limit(limit);

      if (productsError) throw productsError;

      return {
        success: true,
        data: {
          products: products || [],
          topQueries: topQueries.slice(0, 5)
        }
      };

    } catch (error) {
      console.error('Get trending products error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get popular search terms
   * @param {number} limit - Number of popular searches
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Popular searches with counts
   */
  async getPopularSearchTerms(limit = 10, days = 30) {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const { data, error } = await supabase
        .from('search_history')
        .select('search_query, results_count')
        .gte('created_at', dateThreshold.toISOString());

      if (error) throw error;

      // Count occurrences and calculate average results
      const searchStats = {};
      data.forEach(item => {
        const query = item.search_query.toLowerCase().trim();
        if (query) {
          if (!searchStats[query]) {
            searchStats[query] = {
              count: 0,
              totalResults: 0,
              avgResults: 0
            };
          }
          searchStats[query].count += 1;
          searchStats[query].totalResults += item.results_count || 0;
        }
      });

      // Calculate averages and sort
      const popularSearches = Object.entries(searchStats)
        .map(([query, stats]) => ({
          query,
          searchCount: stats.count,
          avgResults: Math.round(stats.totalResults / stats.count)
        }))
        .sort((a, b) => b.searchCount - a.searchCount)
        .slice(0, limit);

      return {
        success: true,
        data: { popularSearches }
      };

    } catch (error) {
      console.error('Get popular search terms error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get searches with no results
   * @param {number} limit - Number of no-result searches
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} No-result searches
   */
  async getNoResultSearches(limit = 20, days = 30) {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const { data, error } = await supabase
        .from('search_history')
        .select('search_query, created_at')
        .eq('results_count', 0)
        .gte('created_at', dateThreshold.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Count occurrences
      const queryCount = {};
      data.forEach(item => {
        const query = item.search_query.toLowerCase().trim();
        if (query) {
          queryCount[query] = (queryCount[query] || 0) + 1;
        }
      });

      const noResultSearches = Object.entries(queryCount)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count);

      return {
        success: true,
        data: { noResultSearches }
      };

    } catch (error) {
      console.error('Get no-result searches error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get search analytics summary
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Analytics summary
   */
  async getSearchAnalyticsSummary(days = 30) {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      // Get all searches in period
      const { data: allSearches, error: searchError } = await supabase
        .from('search_history')
        .select('search_query, results_count, created_at')
        .gte('created_at', dateThreshold.toISOString());

      if (searchError) throw searchError;

      // Calculate statistics
      const totalSearches = allSearches.length;
      const uniqueQueries = new Set(allSearches.map(s => s.search_query.toLowerCase())).size;
      const noResultSearches = allSearches.filter(s => s.results_count === 0).length;
      const avgResultsPerSearch = totalSearches > 0
        ? Math.round(allSearches.reduce((sum, s) => sum + (s.results_count || 0), 0) / totalSearches)
        : 0;

      // Get top 5 searches
      const queryCount = {};
      allSearches.forEach(item => {
        const query = item.search_query.toLowerCase().trim();
        if (query) {
          queryCount[query] = (queryCount[query] || 0) + 1;
        }
      });

      const topSearches = Object.entries(queryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([query, count]) => ({ query, count }));

      return {
        success: true,
        data: {
          summary: {
            totalSearches,
            uniqueQueries,
            noResultSearches,
            noResultRate: totalSearches > 0 ? ((noResultSearches / totalSearches) * 100).toFixed(1) : 0,
            avgResultsPerSearch,
            period: `Last ${days} days`
          },
          topSearches
        }
      };

    } catch (error) {
      console.error('Get search analytics summary error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get related searches based on query
   * @param {string} query - Search query
   * @param {number} limit - Number of related searches
   * @returns {Promise<Object>} Related searches
   */
  async getRelatedSearches(query, limit = 5) {
    try {
      if (!query || query.trim() === '') {
        return {
          success: true,
          data: { relatedSearches: [] }
        };
      }

      const searchTerm = query.toLowerCase().trim();

      // Get searches containing similar words
      const { data, error } = await supabase
        .from('search_history')
        .select('search_query, results_count')
        .ilike('search_query', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Count occurrences and filter out exact match
      const queryCount = {};
      data.forEach(item => {
        const q = item.search_query.toLowerCase().trim();
        if (q !== searchTerm && item.results_count > 0) {
          queryCount[q] = (queryCount[q] || 0) + 1;
        }
      });

      const relatedSearches = Object.entries(queryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([query, count]) => ({ query, count }));

      return {
        success: true,
        data: { relatedSearches }
      };

    } catch (error) {
      console.error('Get related searches error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AnalyticsService();
