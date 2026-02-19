-- ============================================
-- Amazon-Style Product Detail Page (PDP)
-- Complete Database Migration - V3 WORKING
-- ============================================

-- STEP 1: Create all new tables first
-- ============================================

-- 1. Enhanced Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  alt_text VARCHAR(200),
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  image_type VARCHAR(20) DEFAULT 'photo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Product Specifications Table
CREATE TABLE IF NOT EXISTS product_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  spec_name VARCHAR(100) NOT NULL,
  spec_value VARCHAR(500) NOT NULL,
  spec_group VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Product Features Table
CREATE TABLE IF NOT EXISTS product_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  feature_text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Product Reviews Table
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  review_text TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Review Images Table
CREATE TABLE IF NOT EXISTS review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Review Helpful Votes Table
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- 7. Product Questions Table
CREATE TABLE IF NOT EXISTS product_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT false,
  answer_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Product Answers Table
CREATE TABLE IF NOT EXISTS product_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES product_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  is_seller_answer BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Product Badges Table
CREATE TABLE IF NOT EXISTS product_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  badge_text VARCHAR(100),
  badge_color VARCHAR(20),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Product Variants Table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_type VARCHAR(50) NOT NULL,
  variant_value VARCHAR(100) NOT NULL,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  sku_suffix VARCHAR(50),
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 11. Frequently Bought Together Table
CREATE TABLE IF NOT EXISTS frequently_bought_together (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  frequency_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, related_product_id)
);

-- 12. Product Views Tracking
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- STEP 2: Add columns to existing tables
-- ============================================

-- Add columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description VARCHAR(500);
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_number VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_info TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS whats_in_box TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add columns to inventory table
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS max_order_quantity INTEGER DEFAULT 10;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS restock_date DATE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS warehouse_location VARCHAR(100);

-- STEP 3: Create indexes
-- ============================================

-- Product Images indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);

-- Product Specifications indexes
CREATE INDEX IF NOT EXISTS idx_product_specs_product ON product_specifications(product_id);

-- Product Features indexes
CREATE INDEX IF NOT EXISTS idx_product_features_product ON product_features(product_id);

-- Product Reviews indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(product_id, rating);

-- Review Images indexes
CREATE INDEX IF NOT EXISTS idx_review_images_review ON review_images(review_id);

-- Review Votes indexes
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);

-- Product Questions indexes
CREATE INDEX IF NOT EXISTS idx_product_questions_product ON product_questions(product_id);

-- Product Answers indexes
CREATE INDEX IF NOT EXISTS idx_product_answers_question ON product_answers(question_id);

-- Product Badges indexes
CREATE INDEX IF NOT EXISTS idx_product_badges_product ON product_badges(product_id);
CREATE INDEX IF NOT EXISTS idx_product_badges_active ON product_badges(product_id, is_active);

-- Product Variants indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

-- Frequently Bought Together indexes
CREATE INDEX IF NOT EXISTS idx_fbt_product ON frequently_bought_together(product_id);

-- Product Views indexes
CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_user ON product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_date ON product_views(viewed_at);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- STEP 4: Create views
-- ============================================

-- Product rating summary view
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
  COUNT(CASE WHEN is_verified_purchase = true THEN 1 END) as verified_purchases
FROM product_reviews
WHERE is_approved = true
GROUP BY product_id;

-- STEP 5: Create functions and triggers
-- ============================================

-- Function to update review helpful count
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

-- Function to update question answer count
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

-- Function to increment product view count
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

-- Function to check and update low stock status
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

-- STEP 6: Add comments
-- ============================================

COMMENT ON TABLE product_images IS 'Stores multiple images for each product with zoom support';
COMMENT ON TABLE product_specifications IS 'Technical specifications displayed in table format';
COMMENT ON TABLE product_features IS 'Bullet point features displayed prominently';
COMMENT ON TABLE product_reviews IS 'Customer reviews with verified purchase badges';
COMMENT ON TABLE product_badges IS 'Dynamic badges like Best Seller, Deal of the Day';
COMMENT ON TABLE frequently_bought_together IS 'Products commonly purchased together';
COMMENT ON TABLE product_views IS 'Tracks product page views for analytics';

-- Migration complete!
SELECT 'Amazon PDP Migration V3 completed successfully!' as status;
