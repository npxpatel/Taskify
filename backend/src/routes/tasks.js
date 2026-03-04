const { Router } = require('express');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { authenticate } = require('../middleware/authenticate');

const router = Router();

router.use(authenticate);

router.get('/',             getTasks);
router.post('/',            createTask);
router.patch('/:taskId',    updateTask);
router.delete('/:taskId',   deleteTask);

module.exports = router;
