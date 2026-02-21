const discountService = require('../../services/discountServices/discount.service');
const supabase = require('../../config/supabase');

/**
 * DiscountController
 * Handles discount rule management and application
 */
class DiscountController {
  /**
   * Create a new discount rule (Admin only)
   * POST /api/discounts/rules
   */
  async createDiscountRule(req, res) {
    try {
      const {
        name,
        description,
        discount_type,
        discount_value,
        percentage_value,
        buy_quantity,
        get_quantity,
        applicable_to,
        category_ids,
        product_ids,
        start_date,
        end_date,
        allow_stacking,
        priority,
        max_uses_per_customer,
        max_total_uses,
        min_purchase_amount
      } = req.body;

      // Validate rule data
      const validation = discountService.validateRule(req.body);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Determine initial status
      const status = discountService.determineStatus(start_date, end_date);

      // Create discount rule
      const { data: rule, error } = await supabase
        .from('discount_rules')
        .insert({
          name,
          description,
          discount_type,
          discount_value,
          percentage_value,
          buy_quantity,
          get_quantity,
          applicable_to,
          category_ids: category_ids || [],
          product_ids: product_ids || [],
          start_date,
          end_date,
          status,
          allow_stacking: allow_stacking || false,
          priority: priority || 0,
          max_uses_per_customer,
          max_total_uses,
          min_purchase_amount,
          created_by: req.user.id,
          current_total_uses: 0
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Discount rule created successfully',
        data: rule
      });
    } catch (error) {
      console.error('Error creating discount rule:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create discount rule',
        error: error.message
      });
    }
  }

  /**
   * Update a discount rule (Admin only)
   * PUT /api/discounts/rules/:id
   */
  async updateDiscountRule(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate if provided
      if (Object.keys(updateData).length > 0) {
        const validation = discountService.validateRule({
          ...updateData,
          // Provide defaults for required fields if not in update
          name: updateData.name || 'temp',
          discount_type: updateData.discount_type || 'percentage',
          discount_value: updateData.discount_value !== undefined ? updateData.discount_value : 0,
          start_date: updateData.start_date || new Date(),
          end_date: updateData.end_date || new Date(Date.now() + 86400000)
        });

        if (!validation.valid && updateData.start_date && updateData.end_date) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validation.errors
          });
        }
      }

      // Update status if dates changed
      if (updateData.start_date || updateData.end_date) {
        const { data: existingRule } = await supabase
          .from('discount_rules')
          .select('start_date, end_date')
          .eq('id', id)
          .single();

        const startDate = updateData.start_date || existingRule?.start_date;
        const endDate = updateData.end_date || existingRule?.end_date;
        updateData.status = discountService.determineStatus(startDate, endDate);
      }

      updateData.updated_at = new Date().toISOString();

      const { data: rule, error } = await supabase
        .from('discount_rules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Discount rule not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Discount rule updated successfully',
        data: rule
      });
    } catch (error) {
      console.error('Error updating discount rule:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update discount rule',
        error: error.message
      });
    }
  }

  /**
   * Delete a discount rule (Admin only)
   * DELETE /api/discounts/rules/:id
   */
  async deleteDiscountRule(req, res) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('discount_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Discount rule deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting discount rule:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete discount rule',
        error: error.message
      });
    }
  }

  /**
   * Get all discount rules (Admin only)
   * GET /api/discounts/rules
   */
  async getAllDiscountRules(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('discount_rules')
        .select('*', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: rules, error, count } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: rules || [],
        pagination: {
          total: count || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((count || 0) / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching discount rules:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch discount rules',
        error: error.message
      });
    }
  }

  /**
   * Get active discount rules (Public)
   * GET /api/discounts/active
   */
  async getActiveDiscountRules(req, res) {
    try {
      const now = new Date().toISOString();

      const { data: rules, error } = await supabase
        .from('discount_rules')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', now)
        .gt('end_date', now)
        .order('priority', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: rules || []
      });
    } catch (error) {
      console.error('Error fetching active discount rules:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch active discount rules',
        error: error.message
      });
    }
  }


  /**
   * Apply discounts to cart items (Customer)
   * POST /api/discounts/apply-to-cart
   */
  async applyDiscountsToCart(req, res) {
    try {
      const { cartItems } = req.body;

      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart items are required'
        });
      }

      // Revalidate discounts for all cart items
      const result = await discountService.revalidateDiscounts(cartItems);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error applying discounts to cart:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to apply discounts',
        error: error.message
      });
    }
  }

  /**
   * Get discount analytics (Admin only)
   * GET /api/discounts/analytics
   */
  async getDiscountAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const analytics = await discountService.calculateAnalytics(startDate, endDate);

      return res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching discount analytics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch discount analytics',
        error: error.message
      });
    }
  }

  /**
   * Export discount analytics to CSV (Admin only)
   * GET /api/discounts/analytics/export
   */
  async exportDiscountAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const analytics = await discountService.calculateAnalytics(startDate, endDate);

      // Convert to CSV format
      const csvRows = [];
      
      // Header
      csvRows.push('Rule ID,Rule Name,Discount Type,Total Discount Amount,Order Count');

      // Data rows
      for (const rule of analytics.rule_analytics) {
        csvRows.push([
          rule.rule_id,
          `"${rule.rule_name}"`,
          rule.discount_type,
          rule.total_discount_amount.toFixed(2),
          rule.order_count
        ].join(','));
      }

      // Summary rows
      csvRows.push('');
      csvRows.push('Summary');
      csvRows.push(`Total Discount Amount,${analytics.total_discount_amount.toFixed(2)}`);
      csvRows.push(`Orders With Discounts,${analytics.orders_with_discounts}`);
      csvRows.push(`Orders Without Discounts,${analytics.orders_without_discounts}`);
      csvRows.push(`Avg Order Value With Discounts,${analytics.avg_order_value_with_discounts.toFixed(2)}`);
      csvRows.push(`Avg Order Value Without Discounts,${analytics.avg_order_value_without_discounts.toFixed(2)}`);
      csvRows.push(`Total Revenue,${analytics.total_revenue.toFixed(2)}`);
      csvRows.push(`Projected Revenue Without Discounts,${analytics.projected_revenue_without_discounts.toFixed(2)}`);
      csvRows.push(`Revenue Impact,${analytics.revenue_impact.toFixed(2)}`);

      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=discount-analytics-${Date.now()}.csv`);
      
      return res.status(200).send(csv);
    } catch (error) {
      console.error('Error exporting discount analytics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to export discount analytics',
        error: error.message
      });
    }
  }
}

module.exports = new DiscountController();
