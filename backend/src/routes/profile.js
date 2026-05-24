const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/profileController');

const router = Router();

router.get('/', authenticate, getProfile);
router.patch('/', authenticate, updateProfile);

module.exports = router;
