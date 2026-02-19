/**
 * Filter Service
 * Provides dynamic filter options based on available products
 */

const supabase = require('../../config/supabase');

class FilterService {
  /**
   * Get all available filter options
   * @param {Object} params - Optional filters to narrow down options
   * @returns {Promise<Object>} Available filter options
   */
  async getFilterOptions(params = {}) {
    try {
      const { query = '', category = null } = params;

      // Build base query for active approved products
      let baseQuery = supabase
        .from('products')
        .select('price, average_rating, category_id, brand_id')
        .eq('status', 'active')
        .eq('approval_status', 'approved');

      // Apply search query if provided
      if (query && query.trim() !== '') {
        baseQuery = baseQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`);
      }

      // Apply category filter if provided
      if (category) {
        baseQuery = baseQuery.eq('category_id', category);
      }

      const { data: products, error: productsError } = await baseQuery;

      if (productsError) {
        throw productsError;
      }

      // Get price range
      const prices = products.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
      const priceRange = {
        min: prices.length > 0 ? Math.floor(Math.min(...prices)) : 0,
        max: prices.length > 0 ? Math.ceil(Math.max(...prices)) : 10000
      };

      // Get rating distribution
      const ratingDistribution = {
        '4+': products.filter(p => p.average_rating >= 4).length,
        '3+': products.filter(p => p.average_rating >= 3).length,
        '2+': products.filter(p => p.average_rating >= 2).length,
        '1+': products.filter(p => p.average_rating >= 1).length
      };

      // Get available categories
      const categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))];
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, slug')
        .in('id', categoryIds.length > 0 ? categoryIds : ['00000000-0000-0000-0000-000000000000']);

      if (categoriesError) {
        throw categoriesError;
      }

      // Get available brands
      const brandIds = [...new Set(products.map(p => p.brand_id).filter(Boolean))];
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, slug')
        .in('id', brandIds.length > 0 ? brandIds : ['00000000-0000-0000-0000-000000000000'])
        .eq('is_active', true);

      if (brandsError) {
        throw brandsError;
      }

      return {
        success: true,
        data: {
          priceRange,
          ratingDistribution,
          categories: categories || [],
          brands: brands || [],
          totalProducts: products.length
        }
      };

    } catch (error) {
      console.error('Filter service error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all brands
   * @returns {Promise<Object>} All active brands
   */
  async getAllBrands() {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, slug, logo_url, description')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: { brands: data || [] }
      };

    } catch (error) {
      console.error('Get brands error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all categories
   * @returns {Promise<Object>} All categories
   */
  async getAllCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: { categories: data || [] }
      };

    } catch (error) {
      console.error('Get categories error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get price ranges (predefined buckets)
   * @returns {Object} Price range options
   */
  getPriceRanges() {
    return {
      success: true,
      data: {
        ranges: [
          { label: 'Under $25', min: 0, max: 25 },
          { label: '$25 to $50', min: 25, max: 50 },
          { label: '$50 to $100', min: 50, max: 100 },
          { label: '$100 to $200', min: 100, max: 200 },
          { label: '$200 to $500', min: 200, max: 500 },
          { label: '$500 & Above', min: 500, max: null }
        ]
      }
    };
  }

  /**
   * Get rating options
   * @returns {Object} Rating filter options
   */
  getRatingOptions() {
    return {
      success: true,
      data: {
        options: [
          { label: '4 Stars & Up', value: 4 },
          { label: '3 Stars & Up', value: 3 },
          { label: '2 Stars & Up', value: 2 },
          { label: '1 Star & Up', value: 1 }
        ]
      }
    };
  }
}

module.exports = new FilterService();
