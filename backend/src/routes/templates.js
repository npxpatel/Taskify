const { Router } = require('express');
const { getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, seedDefaultTemplates } = require('../controllers/templateController');
const { authenticate } = require('../middleware/authenticate');

const router = Router();

router.use(authenticate);

router.get('/',                     getTemplates);
router.post('/seed-defaults',       seedDefaultTemplates);
router.get('/:templateId',          getTemplate);
router.post('/',                    createTemplate);
router.patch('/:templateId',        updateTemplate);
router.delete('/:templateId',       deleteTemplate);

module.exports = router;
