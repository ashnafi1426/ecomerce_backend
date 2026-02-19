const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sampleReviews = [
  // 5-star reviews (3)
  {
    rating: 5,
    title: 'Absolutely love it!',
    review_text: 'This product is amazing! The quality exceeded my expectations. It arrived quickly and was exactly as described. I have been using it for 2 weeks now and it works perfectly. Highly recommend to anyone looking for a reliable product.',
    verified_purchase: true,
    helpful_count: 24
  },
  {
    rating: 5,
    title: 'Best purchase this year',
    review_text: 'I am so happy with this purchase! The build quality is exceptional and it does everything I need. Worth every penny. Will definitely buy from this seller again.',
    verified_purchase: true,
    helpful_count: 18
  },
  {
    rating: 5,
    title: 'Perfect!',
    review_text: 'Exactly what I was looking for. Great value for money. Fast shipping too!',
    verified_purchase: true,
    helpful_count: 12
  },
  // 4-star reviews (5)
  {
    rating: 4,
    title: 'Very good product',
    review_text: 'Great product overall. Only minor issue is the packaging could be better, but the product itself is excellent. Does exactly what it is supposed to do.',
    verified_purchase: true,
    helpful_count: 15
  },
  {
    rating: 4,
    title: 'Good value',
    review_text: 'Good quality for the price. Works as expected. Delivery was fast. Would recommend.',
    verified_purchase: true,
    helpful_count: 10
  },
  {
    rating: 4,
    title: 'Solid choice',
    review_text: 'Does what it says on the tin. No complaints. Happy with my purchase.',
    verified_purchase: true,
    helpful_count: 8
  },
  {
    rating: 4,
    title: 'Recommended',
    review_text: 'Good product. Meets all my needs. Slightly expensive but worth it for the quality.',
    verified_purchase: false,
    helpful_count: 6
  },
  {
    rating: 4,
    title: 'Happy customer',
    review_text: 'Works great. Easy to use. Good customer service from the seller.',
    verified_purchase: true,
    helpful_count: 5
  },
  // 3-star reviews (2)
  {
    rating: 3,
    title: 'It is okay',
    review_text: 'Product is decent but nothing special. Does the job but could be better. For the price, I expected a bit more.',
    verified_purchase: true,
    helpful_count: 7
  },
  {
    rating: 3,
    title: 'Average',
    review_text: 'Not bad, not great. Just average. There are probably better options available at this price point.',
    verified_purchase: false,
    helpful_count: 4
  },
  // 2-star review (1)
  {
    rating: 2,
    title: 'Disappointed',
    review_text: 'Expected better quality for the price. Had some issues with it after a week of use. Customer service was slow to respond.',
    verified_purchase: true,
    helpful_count: 9
  },
  // 1-star review (1)
  {
    rating: 1,
    title: 'Not as described',
    review_text: 'Product did not match the description at all. Very disappointed with this purchase. Would not recommend.',
    verified_purchase: true,
    helpful_count: 11
  }
];

async function addSampleReviews() {
  try {
    console.log('🔍 Finding product and user...\n');

    // Get first active product
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, title, price')
      .eq('is_active', true)
      .limit(10);

    if (productError) throw productError;
    if (!products || products.length === 0) {
      console.log('❌ No active products found!');
      return;
    }

    console.log('📦 Available products:');
    
    // Check which products have no reviews
    let productId = null;
    let productName = null;
    
    for (const p of products) {
      const { data: existingReviews } = await supabase
        .from('product_reviews')
        .select('id')
        .eq('product_id', p.id);
      
      const reviewCount = existingReviews ? existingReviews.length : 0;
      console.log(`   ${p.title.substring(0, 40)} - ${reviewCount} reviews`);
      
      if (reviewCount === 0 && !productId) {
        productId = p.id;
        productName = p.title;
      }
    }

    if (!productId) {
      console.log('\n❌ All products already have reviews!');
      console.log('   Choose a product ID manually or delete existing reviews.\n');
      return;
    }

    console.log(`\n✅ Selected product: ${productName}`);
    console.log(`   ID: ${productId}\n`);

    // Get multiple customer users for variety
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'customer')
      .limit(15);

    if (userError) throw userError;

    let userIds = [];
    if (!users || users.length === 0) {
      // If no customers, use any users
      const { data: anyUsers } = await supabase
        .from('users')
        .select('id, email')
        .limit(15);
      
      if (!anyUsers || anyUsers.length === 0) {
        console.log('❌ No users found in database!');
        return;
      }
      userIds = anyUsers.map(u => u.id);
      console.log(`✅ Using ${userIds.length} users for reviews\n`);
    } else {
      userIds = users.map(u => u.id);
      console.log(`✅ Using ${userIds.length} customer users for reviews\n`);
    }

    if (userIds.length < 12) {
      console.log(`⚠️  Only ${userIds.length} users available. Will add ${userIds.length} reviews instead of 12.\n`);
    }

    console.log('📝 Adding sample reviews...\n');

    // Insert reviews with different users
    const reviewsToInsert = sampleReviews.slice(0, userIds.length).map((review, index) => ({
      product_id: productId,
      user_id: userIds[index % userIds.length],
      ...review,
      is_approved: true
    }));

    const { data: insertedReviews, error: insertError } = await supabase
      .from('product_reviews')
      .insert(reviewsToInsert)
      .select();

    if (insertError) throw insertError;

    console.log(`✅ Successfully added ${insertedReviews.length} reviews!\n`);

    // Get summary
    const { data: summary } = await supabase
      .from('product_reviews')
      .select('rating, verified_purchase')
      .eq('product_id', productId);

    if (summary) {
      const totalReviews = summary.length;
      const avgRating = (summary.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(2);
      const fiveStar = summary.filter(r => r.rating === 5).length;
      const fourStar = summary.filter(r => r.rating === 4).length;
      const threeStar = summary.filter(r => r.rating === 3).length;
      const twoStar = summary.filter(r => r.rating === 2).length;
      const oneStar = summary.filter(r => r.rating === 1).length;
      const verified = summary.filter(r => r.verified_purchase).length;

      console.log('📊 Review Summary:');
      console.log('='.repeat(50));
      console.log(`   Total Reviews: ${totalReviews}`);
      console.log(`   Average Rating: ${avgRating} ⭐`);
      console.log(`   5 ⭐: ${fiveStar} (${Math.round(fiveStar/totalReviews*100)}%)`);
      console.log(`   4 ⭐: ${fourStar} (${Math.round(fourStar/totalReviews*100)}%)`);
      console.log(`   3 ⭐: ${threeStar} (${Math.round(threeStar/totalReviews*100)}%)`);
      console.log(`   2 ⭐: ${twoStar} (${Math.round(twoStar/totalReviews*100)}%)`);
      console.log(`   1 ⭐: ${oneStar} (${Math.round(oneStar/totalReviews*100)}%)`);
      console.log(`   Verified Purchases: ${verified} (${Math.round(verified/totalReviews*100)}%)`);
      console.log('='.repeat(50));
    }

    console.log('\n✅ Done! Visit your product page to see the reviews.');
    console.log(`   Product ID: ${productId}`);
    console.log(`   URL: http://localhost:5173/product/${productId}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

// Run the script
addSampleReviews();
