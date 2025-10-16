const express = require('express');
const { allMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const path = require('path');

const router = express.Router();

router.route('/').post(protect, upload.array('files', 5), sendMessage);
router.route('/:chatId').get(protect, allMessages);

module.exports = router;
