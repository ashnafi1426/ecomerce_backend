const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const {
  getProductQuestions,
  askQuestion,
  submitAnswer,
  markBestAnswer
} = require('../../controllers/questionControllers/question.controller');

// Public routes
router.get('/:productId/questions', getProductQuestions);

// Protected routes
router.post('/:productId/questions', authenticate, askQuestion);
router.post('/questions/:questionId/answers', authenticate, submitAnswer);
router.put('/answers/:answerId/best', authenticate, markBestAnswer);

module.exports = router;
