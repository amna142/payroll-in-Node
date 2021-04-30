

const express = require('express')
const router = express.Router()
const LeavesController = require('../controllers/leavesController')
const LateComingsController = require('../controllers/LateComings')
const isAuth = require('../middlewares/is-auth')
router.get('/leaves', isAuth, LeavesController.getLeaves)
router.post('/leaves', isAuth, LeavesController.postLeave)
router.get('/leave/accept/(:id)', isAuth, LeavesController.AcceptLeave, LeavesController.getLeaves)
router.post('/leave/reject/', isAuth, LeavesController.RejectLeave, LeavesController.getLeaves)

router.post('/late_comings', isAuth, LateComingsController.CalculateLateComings, LeavesController.getLeaves)
router.get('/late_comings_display', isAuth, LateComingsController.getLateComings)
router.post('/salary_deduction', isAuth, LeavesController.deductSalary)
router.post('/deduct_leave', isAuth, LeavesController.deductLeave)
module.exports = router