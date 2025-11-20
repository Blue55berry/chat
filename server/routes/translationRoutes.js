const express = require('express');
const { translateText } = require('../controllers/translationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').post(protect, translateText);

module.exports = router;
