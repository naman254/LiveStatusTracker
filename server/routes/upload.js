const express = require('express');
const router = express.Router();
const { uploadHandler } = require('../controllers/uploadController');

router.post('/upload', uploadHandler);

module.exports = router;
