const supabase = require('../../config/supabase');

/**
 * DiscountService
 * Handles discount rule management, evaluation, and application
 */
class DiscountService {
  /**
   * Validate discount rule data
   * @param {Object} ruleData - Discount rule data to validate
   * @returns {Object} - Validation result { valid: boolean, errors: string[] }
   */
  validateRule(ruleData) {
    const errors = [];

    // Required fields validation
    if (!ruleData.name || ruleData.name.trim() === '') {
      errors.push('Discount name is required');
    }

    if (!ruleData.discount_type) {
      errors.push('Discount type is required');
    } else if (!['percentage', 'fixed_amount', 'buy_x_get_y'].includes(ruleData.discount_type)) {
      errors.push('Invalid discount type. Must be percentage, fixed_amount, or buy_x_get_y');
    }

    if (ruleData.discount_value === undefined || ruleData.discount_value === null) {
      errors.push('Discount value is required');
    } else if (ruleData.discount_value < 0) {
      errors.push('Discount value must be non-negative');
    }

    // Percentage validation (5-90%)
    if (ruleData.discount_type === 'percentage') {
      if (!ruleData.percentage_value) {
        errors.push('Percentage value is required for percentage discounts');
      } else if (ruleData.percentage_value < 5 || ruleData.percentage_value > 90) {
        errors.push('Percentage value must be between 5% and 90%');
      }
    }

    // Buy-X-Get-Y validation
    if (ruleData.discount_type === 'buy_x_get_y') {
      if (!ruleData.buy_quantity || ruleData.buy_quantity <= 0) {
        errors.push('Buy quantity must be greater than 0 for buy-X-get-Y discounts');
      }
      if (!ruleData.get_quantity || ruleData.get_quantity <= 0) {
        errors.push('Get quantity must be greater than 0 for buy-X-get-Y discounts');
      }
    }

    // Date range validation
    if (!ruleData.start_date) {
      errors.push('Start date is required');
    }
    if (!ruleData.end_date) {
      errors.push('End date is required');
    }
    if (ruleData.start_date && ruleData.end_date) {
      const startDate = new Date(ruleData.start_date);
      const endDate = new Date(ruleData.end_date);
      if (startDate >= endDate) {
        errors.push('Start date must be before end date');
      }
    }

    // Applicability validation
    if (!ruleData.applicable_to) {
      errors.push('Applicable to field is required');
    } else if (!['all_products', 'specific_categories', 'specific_products'].includes(ruleData.applicable_to)) {
      errors.push('Invalid applicable_to value');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Determine discount rule status based on dates
   * @param {Date} startDate - Rule start date
   * @param {Date} endDate - Rule end date
   * @returns {string} - Status: 'scheduled', 'active', or 'expired'
   */
  determineStatus(startDate, endDate) {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return 'scheduled';
    } else if (now >= start && now < end) {
      return 'active';
    } else {
      return 'expired';
    }
  }

  /**
   * Evaluate applicable discount rules for a product
   * @param {string} productId - Product UUID
   * @param {string} categoryId - Category UUID
   * @returns {Promise<Array>} - Array of applicable discount rules
   */
  async evaluateDiscounts(productId, categoryId) {
    try {
      const now = new Date().toISOString();

      // Get all active discount rules
      const { data: rules, error } = await supabase
        .from('discount_rules')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', now)
        .gt('end_date', now);

      if (error) throw error;

      // Filter rules that apply to this product
      const applicableRules = rules.filter(rule => {
        if (rule.applicable_to === 'all_products') {
          return true;
        }

        if (rule.applicable_to === 'specific_categories' && categoryId) {
          const categoryIds = rule.category_ids || [];
          return categoryIds.includes(categoryId);
        }

        if (rule.applicable_to === 'specific_products' && productId) {
          const productIds = rule.product_ids || [];
          return productIds.includes(productId);
        }

        return false;
      });

      return applicableRules;
    } catch (error) {
      console.error('Error evaluating discounts:', error);
      throw error;
    }
  }

  /**
   * Apply stacking rules to discount rules
   * @param {Array} rules - Array of discount rules
   * @returns {Array} - Filtered/sorted rules based on stacking logic
   */
  applyStackingRules(rules) {
    if (!rules || rules.length === 0) {
      return [];
    }

    // Check if any rule allows stacking
    const allowStacking = rules.some(rule => rule.allow_stacking === true);

    if (!allowStacking) {
      // No stacking: select the highest discount
      return [this.selectHighestDiscount(rules)];
    }

    // Stacking allowed: sort by priority (higher first), then by type
    // Apply percentage discounts first, then fixed amount
    const sortedRules = [...rules].sort((a, b) => {
      // First sort by priority (descending)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // Then by type: percentage before fixed_amount
      const typeOrder = { percentage: 1, fixed_amount: 2, buy_x_get_y: 3 };
      return typeOrder[a.discount_type] - typeOrder[b.discount_type];
    });

    return sortedRules;
  }

  /**
   * Select the highest discount from multiple rules
   * @param {Array} rules - Array of discount rules
   * @returns {Object} - Rule with highest discount value
   */
  selectHighestDiscount(rules) {
    if (!rules || rules.length === 0) return null;
    if (rules.length === 1) return rules[0];

    // Compare discount values (for percentage, use percentage_value)
    return rules.reduce((highest, current) => {
      const highestValue = highest.discount_type === 'percentage' 
        ? highest.percentage_value 
        : highest.discount_value;
      const currentValue = current.discount_type === 'percentage'
        ? current.percentage_value
        : current.discount_value;

      return currentValue > highestValue ? current : highest;
    });
  }

  /**
   * Calculate discounted price after applying discount rules
   * @param {number} originalPrice - Original product price
   * @param {Array} rules - Array of discount rules to apply
   * @returns {Object} - { finalPrice, appliedDiscounts, totalSavings }
   */
  calculateDiscountedPrice(originalPrice, rules) {
    if (!rules || rules.length === 0) {
      return {
        finalPrice: originalPrice,
        appliedDiscounts: [],
        totalSavings: 0
      };
    }

    const stackedRules = this.applyStackingRules(rules);
    let currentPrice = originalPrice;
    const appliedDiscounts = [];
    let totalSavings = 0;

    for (const rule of stackedRules) {
      let discountAmount = 0;

      if (rule.discount_type === 'percentage') {
        discountAmount = currentPrice * (rule.percentage_value / 100);
      } else if (rule.discount_type === 'fixed_amount') {
        discountAmount = Math.min(rule.discount_value, currentPrice);
      }

      const priceAfterDiscount = Math.max(0, currentPrice - discountAmount);
      
      appliedDiscounts.push({
        rule_id: rule.id,
        rule_name: rule.name,
        discount_type: rule.discount_type,
        discount_value: rule.discount_value,
        savings: discountAmount,
        price_before: currentPrice,
        price_after: priceAfterDiscount
      });

      totalSavings += discountAmount;
      currentPrice = priceAfterDiscount;
    }

    return {
      finalPrice: currentPrice,
      appliedDiscounts,
      totalSavings
    };
  }

  /**
   * Revalidate discounts at checkout to ensure rules are still active
   * @param {Array} cartItems - Array of cart items with product IDs
   * @returns {Promise<Object>} - Revalidated cart with current discounts
   */
  async revalidateDiscounts(cartItems) {
    try {
      const revalidatedItems = [];

      for (const item of cartItems) {
        // Re-evaluate discounts for each product
        const applicableRules = await this.evaluateDiscounts(
          item.product_id,
          item.category_id
        );

        const discountResult = this.calculateDiscountedPrice(
          item.price,
          applicableRules
        );

        revalidatedItems.push({
          ...item,
          original_price: item.price,
          discounted_price: discountResult.finalPrice,
          applied_discounts: discountResult.appliedDiscounts,
          savings: discountResult.totalSavings
        });
      }

      const totalSavings = revalidatedItems.reduce(
        (sum, item) => sum + (item.savings || 0),
        0
      );

      return {
        items: revalidatedItems,
        totalSavings
      };
    } catch (error) {
      console.error('Error revalidating discounts:', error);
      throw error;
    }
  }

  /**
   * Store applied discounts in the applied_discounts table for audit trail
   * @param {string} orderId - Order UUID
   * @param {Array} orderItems - Array of order items with applied discounts
   * @returns {Promise<void>}
   */
  async storeAppliedDiscounts(orderId, orderItems) {
    try {
      const appliedDiscountsRecords = [];

      for (const item of orderItems) {
        if (item.applied_discounts && item.applied_discounts.length > 0) {
          for (const discount of item.applied_discounts) {
            appliedDiscountsRecords.push({
              order_id: orderId,
              product_id: item.product_id,
              discount_rule_id: discount.rule_id,
              discount_type: discount.discount_type,
              discount_value: discount.discount_value,
              original_price: discount.price_before,
              discounted_price: discount.price_after,
              savings_amount: discount.savings,
              applied_at: new Date().toISOString()
            });
          }
        }
      }

      if (appliedDiscountsRecords.length > 0) {
        const { error } = await supabase
          .from('applied_discounts')
          .insert(appliedDiscountsRecords);

        if (error) throw error;
      }

      return appliedDiscountsRecords;
    } catch (error) {
      console.error('Error storing applied discounts:', error);
      throw error;
    }
  }

  /**
   * Update discount rule status based on current date
   * Automatically marks rules as 'expired' when end_date passes
   * @returns {Promise<Object>} - { expiredCount, activatedCount }
   */
  async updateDiscountStatus() {
    try {
      const now = new Date().toISOString();

      // Mark expired rules
      const { data: expiredRules, error: expiredError } = await supabase
        .from('discount_rules')
        .update({ status: 'expired', updated_at: now })
        .lt('end_date', now)
        .in('status', ['active', 'scheduled'])
        .select();

      if (expiredError) throw expiredError;

      // Activate scheduled rules that have reached their start date
      const { data: activatedRules, error: activatedError } = await supabase
        .from('discount_rules')
        .update({ status: 'active', updated_at: now })
        .eq('status', 'scheduled')
        .lte('start_date', now)
        .gt('end_date', now)
        .select();

      if (activatedError) throw activatedError;

      return {
        expiredCount: expiredRules?.length || 0,
        activatedCount: activatedRules?.length || 0,
        expiredRules: expiredRules || [],
        activatedRules: activatedRules || []
      };
    } catch (error) {
      console.error('Error updating discount status:', error);
      throw error;
    }
  }

  /**
   * Calculate discount analytics for a given date range
   * @param {Date} startDate - Start date for analytics
   * @param {Date} endDate - End date for analytics
   * @returns {Promise<Object>} - Analytics data
   */
  async calculateAnalytics(startDate, endDate) {
    try {
      const start = startDate ? new Date(startDate).toISOString() : null;
      const end = endDate ? new Date(endDate).toISOString() : null;

      // Get all applied discounts in the date range
      let query = supabase
        .from('applied_discounts')
        .select(`
          *,
          discount_rule:discount_rules(id, name, discount_type),
          order:orders(id, total_amount, created_at)
        `);

      if (start) {
        query = query.gte('applied_at', start);
      }
      if (end) {
        query = query.lte('applied_at', end);
      }

      const { data: appliedDiscounts, error } = await query;

      if (error) throw error;

      // Group by discount rule
      const ruleAnalytics = {};
      let totalDiscountAmount = 0;
      const orderIds = new Set();
      let totalOrderValue = 0;
      let totalOrderValueWithoutDiscounts = 0;

      for (const discount of appliedDiscounts || []) {
        const ruleId = discount.discount_rule_id;
        
        if (!ruleAnalytics[ruleId]) {
          ruleAnalytics[ruleId] = {
            rule_id: ruleId,
            rule_name: discount.discount_rule?.name || 'Unknown',
            discount_type: discount.discount_rule?.discount_type || 'unknown',
            total_discount_amount: 0,
            order_count: 0,
            orders: new Set()
          };
        }

        ruleAnalytics[ruleId].total_discount_amount += parseFloat(discount.savings_amount || 0);
        ruleAnalytics[ruleId].orders.add(discount.order_id);
        
        totalDiscountAmount += parseFloat(discount.savings_amount || 0);
        orderIds.add(discount.order_id);

        if (discount.order) {
          totalOrderValue += parseFloat(discount.order.total_amount || 0);
        }
        totalOrderValueWithoutDiscounts += parseFloat(discount.original_price || 0);
      }

      // Convert rule analytics to array and calculate order counts
      const ruleAnalyticsArray = Object.values(ruleAnalytics).map(rule => ({
        rule_id: rule.rule_id,
        rule_name: rule.rule_name,
        discount_type: rule.discount_type,
        total_discount_amount: rule.total_discount_amount,
        order_count: rule.orders.size
      }));

      // Calculate average order values
      const ordersWithDiscounts = orderIds.size;
      const avgOrderValueWithDiscounts = ordersWithDiscounts > 0 
        ? totalOrderValue / ordersWithDiscounts 
        : 0;

      // Get orders without discounts in the same period for comparison
      let ordersQuery = supabase
        .from('orders')
        .select('id, total_amount, created_at');

      if (start) {
        ordersQuery = ordersQuery.gte('created_at', start);
      }
      if (end) {
        ordersQuery = ordersQuery.lte('created_at', end);
      }

      const { data: allOrders, error: ordersError } = await ordersQuery;

      if (ordersError) throw ordersError;

      const ordersWithoutDiscounts = (allOrders || []).filter(
        order => !orderIds.has(order.id)
      );

      const totalValueWithoutDiscounts = ordersWithoutDiscounts.reduce(
        (sum, order) => sum + parseFloat(order.total_amount || 0),
        0
      );

      const avgOrderValueWithoutDiscounts = ordersWithoutDiscounts.length > 0
        ? totalValueWithoutDiscounts / ordersWithoutDiscounts.length
        : 0;

      // Calculate revenue impact
      const projectedRevenueWithoutDiscounts = totalOrderValueWithoutDiscounts;
      const actualRevenue = totalOrderValue;
      const revenueImpact = projectedRevenueWithoutDiscounts - actualRevenue;

      return {
        rule_analytics: ruleAnalyticsArray,
        total_discount_amount: totalDiscountAmount,
        orders_with_discounts: ordersWithDiscounts,
        orders_without_discounts: ordersWithoutDiscounts.length,
        avg_order_value_with_discounts: avgOrderValueWithDiscounts,
        avg_order_value_without_discounts: avgOrderValueWithoutDiscounts,
        total_revenue: actualRevenue,
        projected_revenue_without_discounts: projectedRevenueWithoutDiscounts,
        revenue_impact: revenueImpact,
        date_range: {
          start: start,
          end: end
        }
      };
    } catch (error) {
      console.error('Error calculating discount analytics:', error);
      throw error;
    }
  }

}

module.exports = new DiscountService();
