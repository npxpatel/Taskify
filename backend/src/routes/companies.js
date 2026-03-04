const { Router } = require('express');
const { searchCompanies } = require('../controllers/companyController');
const { authenticate }    = require('../middleware/authenticate');

const router = Router();

router.get('/search', authenticate, searchCompanies);

module.exports = router;
