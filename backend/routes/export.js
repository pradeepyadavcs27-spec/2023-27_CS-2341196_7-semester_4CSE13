const express = require('express');
const router = express.Router();
const { exportExcel } = require('../controllers/exportController');
const { protect } = require('../middlewares/auth');

// All routes are protected
router.use(protect);

router.get('/excel', exportExcel);

module.exports = router;
