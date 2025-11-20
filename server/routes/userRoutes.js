const express = require('express');
const {
  registerUser,
  authUser,
  allUsers,
  updateUserProfile,
  getUserProfile,
  getChatContacts,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/').post(registerUser).get(protect, allUsers);
router.post('/login', authUser);
router.route('/profile').put(protect, upload.single('profilePic'), updateUserProfile);
router.route('/contacts').get(protect, getChatContacts);
router.route('/:id').get(protect, getUserProfile);

module.exports = router;
