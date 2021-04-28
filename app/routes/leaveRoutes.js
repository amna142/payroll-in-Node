

const express = require('express')
const router = express.Router()
const LeavesController = require('../controllers/leavesController')
const LateComingsController = require('../controllers/LateComings')
const isAuth = require('../middlewares/is-auth')
router.get('/leaves', isAuth, LeavesController.getLeaves)
router.post('/leaves', isAuth, LeavesController.postLeave)
router.get('/leave/accept/(:id)', isAuth, LeavesController.AcceptLeave, LeavesController.getLeaves)
router.post('/leave/reject/', isAuth, LeavesController.RejectLeave, LeavesController.getLeaves)


router.post('/late_comings', isAuth, LateComingsController.CalculateLateComings)
module.exports = router