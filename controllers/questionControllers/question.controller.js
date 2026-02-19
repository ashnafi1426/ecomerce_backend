const supabase = require('../../config/supabase');

// Get questions for a product
const getProductQuestions = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('product_questions')
      .select(`
        *,
        users:user_id (
          id,
          first_name,
          last_name
        ),
        product_answers (
          *,
          users:user_id (
            id,
            first_name,
            last_name
          )
        )
      `, { count: 'exact' })
      .eq('product_id', productId)
      .order('helpful_count', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: {
        questions: data || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0
        }
      }
    });
  } catch (error) {
    console.error('Get product questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: error.message
    });
  }
};

// Ask a question
const askQuestion = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    const { question_text } = req.body;

    if (!question_text || question_text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question text is required'
      });
    }

    const { data, error } = await supabase
      .from('product_questions')
      .insert({
        product_id: productId,
        user_id: userId,
        question_text: question_text.trim()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Question submitted successfully',
      data
    });
  } catch (error) {
    console.error('Ask question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit question',
      error: error.message
    });
  }
};

// Submit an answer
const submitAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user.id;
    const { answer_text } = req.body;

    if (!answer_text || answer_text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Answer text is required'
      });
    }

    // Check if user is the seller of the product
    const { data: question } = await supabase
      .from('product_questions')
      .select('product_id, products!inner(seller_id)')
      .eq('id', questionId)
      .single();

    const isSellerAnswer = question?.products?.seller_id === userId;

    const { data, error } = await supabase
      .from('product_answers')
      .insert({
        question_id: questionId,
        user_id: userId,
        answer_text: answer_text.trim(),
        is_seller_answer: isSellerAnswer
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Answer submitted successfully',
      data
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answer',
      error: error.message
    });
  }
};

// Mark answer as best answer
const markBestAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user.id;

    // Get the question to verify ownership
    const { data: answer } = await supabase
      .from('product_answers')
      .select('question_id, product_questions!inner(user_id)')
      .eq('id', answerId)
      .single();

    if (!answer || answer.product_questions.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the question asker can mark best answer'
      });
    }

    // Unmark other best answers for this question
    await supabase
      .from('product_answers')
      .update({ is_best_answer: false })
      .eq('question_id', answer.question_id);

    // Mark this answer as best
    const { data, error } = await supabase
      .from('product_answers')
      .update({ is_best_answer: true })
      .eq('id', answerId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Best answer marked successfully',
      data
    });
  } catch (error) {
    console.error('Mark best answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark best answer',
      error: error.message
    });
  }
};

module.exports = {
  getProductQuestions,
  askQuestion,
  submitAnswer,
  markBestAnswer
};
