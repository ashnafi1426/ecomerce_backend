-- ============================================
-- Amazon PDP Migration - STEP 2: FINAL WORKING VERSION
-- This version removes the problematic view and creates a simpler one
-- ============================================

-- Create indexes (these should work fine)
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_product_specs_product ON product_specifications(product_id);
CREATE INDEX IF NOT EXISTS idx_product_features_product ON product_features(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(product_id, rating);
CREATE INDEX IF NOT EXISTS idx_review_images_review ON review_images(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_product_questions_product ON product_questions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_answers_question ON product_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_product_badges_product ON product_badges(product_id);
CREATE INDEX IF NOT EXISTS idx_product_badges_active ON product_badges(product_id, is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_fbt_product ON frequently_bought_together(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_user ON product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_date ON product_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

-- Create simplified view (without filtering by is_approved since it doesn't exist)
CREATE OR REPLACE VIEW product_rating_summary AS
SELECT 
  product_id,
  COUNT(*) as total_reviews,
  AVG(rating)::DECIMAL(3,2) as average_rating,
  COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
  COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
  COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
  COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
  COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
  COUNT(CASE WHEN verified_purchase = true THEN 1 END) as verified_purchases
FROM product_reviews
GROUP BY product_id;

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'helpful' THEN
      UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    ELSE
      UPDATE product_reviews SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'helpful' THEN
      UPDATE product_reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    ELSE
      UPDATE product_reviews SET not_helpful_count = not_helpful_count - 1 WHERE id = OLD.review_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_review_helpful_count ON review_votes;
CREATE TRIGGER trigger_update_review_helpful_count
AFTER INSERT OR DELETE ON review_votes
FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

CREATE OR REPLACE FUNCTION update_question_answer_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_questions 
    SET answer_count = answer_count + 1, is_answered = true 
    WHERE id = NEW.question_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_questions 
    SET answer_count = answer_count - 1 
    WHERE id = OLD.question_id;
    
    UPDATE product_questions 
    SET is_answered = (answer_count > 0) 
    WHERE id = OLD.question_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_question_answer_count ON product_answers;
CREATE TRIGGER trigger_update_question_answer_count
AFTER INSERT OR DELETE ON product_answers
FOR EACH ROW EXECUTE FUNCTION update_question_answer_count();

CREATE OR REPLACE FUNCTION increment_product_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET view_count = view_count + 1 WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_product_view_count ON product_views;
CREATE TRIGGER trigger_increment_product_view_count
AFTER INSERT ON product_views
FOR EACH ROW EXECUTE FUNCTION increment_product_view_count();

CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity <= NEW.low_stock_threshold THEN
    RAISE NOTICE 'Low stock alert for product %', NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_low_stock ON inventory;
CREATE TRIGGER trigger_check_low_stock
AFTER UPDATE OF quantity ON inventory
FOR EACH ROW EXECUTE FUNCTION check_low_stock();

-- Add comments
COMMENT ON TABLE product_images IS 'Stores multiple images for each product with zoom support';
COMMENT ON TABLE product_specifications IS 'Technical specifications displayed in table format';
COMMENT ON TABLE product_features IS 'Bullet point features displayed prominently';
COMMENT ON TABLE product_reviews IS 'Customer reviews with verified purchase badges';
COMMENT ON TABLE product_badges IS 'Dynamic badges like Best Seller, Deal of the Day';
COMMENT ON TABLE frequently_bought_together IS 'Products commonly purchased together';
COMMENT ON TABLE product_views IS 'Tracks product page views for analytics';

SELECT 'Step 2 Complete: Indexes, views, and triggers created!' as status;
