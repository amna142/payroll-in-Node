const express = require('express')
const router = express.Router()
const upload = require('../middlewares/multer-file').single('attendance_file')
var settingsController = require('../controllers/settingsController')
const isAuth = require('../middlewares/is-auth')

const AttendanceController = require('../controllers/attendanceController')


// router.get('/settings', isAuth, settingsController.getPage)

router.get('/settings', isAuth, settingsController.getSettings)

router.get('/settings/allowances/add', isAuth, settingsController.getPage)
router.post('/settings/allowances/add', isAuth, settingsController.postAddAllowances)
router.post('/settings/allowance/edit/', isAuth, settingsController.editAllowance)
router.get('/settings/allowance/delete/(:id)', isAuth, settingsController.deleteAllowance)

router.get('/settings/grades/add', isAuth, settingsController.getPage)
router.post('/settings/grades/add', isAuth, settingsController.postAddGrade)
router.post('/settings/grade/edit/', isAuth, settingsController.editGrade)
router.get('/settings/grade/delete/(:id)', isAuth, settingsController.deleteGrade)

router.get('/settings/funds/add', isAuth, settingsController.getPage)
router.post('/settings/funds/add', isAuth, settingsController.postFund)
router.get('/settings/fund/delete/(:id)', isAuth, settingsController.deleteFund)
router.post('/settings/fund/edit/', isAuth, settingsController.editFund)

router.post('/settings/attendance', isAuth, upload, AttendanceController.getAttendanceFile)
router.get('/attendance', isAuth, AttendanceController.getAttendance)

module.exports = router