const { Router } = require('express');
const { getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate } = require('../controllers/templateController');
const { authenticate } = require('../middleware/authenticate');

const router = Router();

router.use(authenticate);

router.get('/',                     getTemplates);
router.get('/:templateId',          getTemplate);
router.post('/',                    createTemplate);
router.patch('/:templateId',        updateTemplate);
router.delete('/:templateId',       deleteTemplate);

module.exports = router;
