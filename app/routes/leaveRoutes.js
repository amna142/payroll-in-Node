

const express = require('express')
const router = express.Router()
const LeavesController = require('../controllers/leavesController')
const isAuth = require('../middlewares/is-auth')
router.get('/leaves', isAuth, LeavesController.getLeaves)
router.post('/leaves', isAuth, LeavesController.postLeave)
router.get('/leave/accept/(:id)', isAuth, LeavesController.AcceptLeave)
router.post('/leave/reject/', isAuth, LeavesController.RejectLeave)


router.post('/late_comings', isAuth, LeavesController.CalculateLateComings)
module.exports = router