/**
 * Search Service
 * Handles advanced product search with full-text search and filtering
 */

const supabase = require('../../config/supabase');

class SearchService {
  /**
   * Advanced product search with filters
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Search results with pagination
   */
  async searchProducts(params) {
    const {
      query = '',
      category = null,
      minPrice = null,
      maxPrice = null,
      minRating = null,
      brands = [],
      sortBy = 'relevance',
      sortOrder = 'asc', // Add sortOrder parameter
      page = 1,
      limit = 20
    } = params;

    try {
      // Calculate offset
      const offset = (page - 1) * limit;

      // Build base query
      let searchQuery = supabase
        .from('products')
        .select(`
          id,
          title,
          description,
          price,
          image_url,
          category_id,
          brand_id,
          brand,
          average_rating,
          total_reviews,
          status,
          approval_status,
          created_at,
          seller_id,
          sku,
          is_featured
        `, { count: 'exact' })
        .eq('status', 'active')
        .eq('approval_status', 'approved');

      // Apply full-text search if query provided
      if (query && query.trim() !== '') {
        // Use textSearch for full-text search on title and description
        searchQuery = searchQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`);
      }

      // Apply category filter
      if (category) {
        // Check if it's a UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(category)) {
          // It's a UUID, use directly
          searchQuery = searchQuery.eq('category_id', category);
        } else {
          // It's a slug/name, lookup category first
          const { data: categoryData, error: catError } = await supabase
            .from('categories')
            .select('id')
            .or(`slug.eq.${category},name.ilike.${category}`)
            .single();
          
          if (categoryData && !catError) {
            searchQuery = searchQuery.eq('category_id', categoryData.id);
          }
          // If category not found, continue without filter (returns all)
        }
      }

      // Apply price range filter
      if (minPrice !== null && minPrice !== undefined) {
        searchQuery = searchQuery.gte('price', minPrice);
      }
      if (maxPrice !== null && maxPrice !== undefined) {
        searchQuery = searchQuery.lte('price', maxPrice);
      }

      // Apply rating filter
      if (minRating !== null && minRating !== undefined) {
        searchQuery = searchQuery.gte('average_rating', minRating);
      }

      // Apply brand filter
      if (brands && brands.length > 0) {
        searchQuery = searchQuery.in('brand_id', brands);
      }

      // Apply sorting
      // Support both formats: sortBy='price-low' OR sortBy='price' + sortOrder='asc'
      const ascending = sortOrder === 'asc' || sortOrder === 'ascending';
      
      switch (sortBy) {
        case 'price-low':
        case 'price':
          searchQuery = searchQuery.order('price', { ascending: ascending });
          break;
        case 'price-high':
          searchQuery = searchQuery.order('price', { ascending: false });
          break;
        case 'rating':
          searchQuery = searchQuery.order('average_rating', { ascending: !ascending }); // Higher ratings first by default
          break;
        case 'newest':
          searchQuery = searchQuery.order('created_at', { ascending: false });
          break;
        case 'relevance':
        default:
          // For relevance, prioritize featured products and then by created_at
          searchQuery = searchQuery
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false });
          break;
      }

      // Apply pagination
      searchQuery = searchQuery.range(offset, offset + limit - 1);

      // Execute query
      const { data, error, count } = await searchQuery;

      if (error) {
        throw error;
      }

      // Calculate pagination info
      const totalPages = Math.ceil(count / limit);
      const hasMore = page < totalPages;

      return {
        success: true,
        data: {
          products: data || [],
          pagination: {
            page,
            limit,
            total: count,
            totalPages,
            hasMore
          }
        }
      };

    } catch (error) {
      console.error('Search service error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get search suggestions/autocomplete
   * @param {string} query - Search query
   * @param {number} limit - Number of suggestions
   * @returns {Promise<Object>} Suggestions
   */
  async getSearchSuggestions(query, limit = 10) {
    try {
      if (!query || query.trim() === '') {
        return {
          success: true,
          data: { suggestions: [] }
        };
      }

      // Get product title suggestions
      const { data, error } = await supabase
        .from('products')
        .select('title, brand')
        .eq('status', 'active')
        .eq('approval_status', 'approved')
        .or(`title.ilike.%${query}%,brand.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        throw error;
      }

      // Extract unique suggestions
      const suggestions = [...new Set(
        data.map(p => p.title)
      )].slice(0, limit);

      return {
        success: true,
        data: { suggestions }
      };

    } catch (error) {
      console.error('Suggestions service error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get popular searches
   * @param {number} limit - Number of popular searches
   * @returns {Promise<Object>} Popular searches
   */
  async getPopularSearches(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('search_query, results_count')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      // Count occurrences
      const searchCounts = {};
      data.forEach(item => {
        const query = item.search_query.toLowerCase();
        searchCounts[query] = (searchCounts[query] || 0) + 1;
      });

      // Sort by count and get top searches
      const popularSearches = Object.entries(searchCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([query, count]) => ({ query, count }));

      return {
        success: true,
        data: { popularSearches }
      };

    } catch (error) {
      console.error('Popular searches service error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save search to history
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {number} resultsCount - Number of results
   * @param {Object} filters - Applied filters
   * @returns {Promise<Object>} Result
   */
  async saveSearchHistory(userId, query, resultsCount, filters = {}) {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .insert({
          user_id: userId || null,
          search_query: query,
          results_count: resultsCount,
          filters_applied: filters
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Save search history error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's recent searches
   * @param {string} userId - User ID
   * @param {number} limit - Number of recent searches
   * @returns {Promise<Object>} Recent searches
   */
  async getRecentSearches(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('search_query, results_count, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: { recentSearches: data || [] }
      };

    } catch (error) {
      console.error('Recent searches service error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new SearchService();
