const { Router } = require('express');
const { getJobs, createJob, updateJob, updateJobLogo, deleteJob } = require('../controllers/jobController');
const { authenticate } = require('../middleware/authenticate');

const router = Router();

router.use(authenticate);

router.get('/',                getJobs);
router.post('/',               createJob);
router.patch('/:jobId',        updateJob);
router.patch('/:jobId/logo',   updateJobLogo);
router.delete('/:jobId',       deleteJob);

module.exports = router;
