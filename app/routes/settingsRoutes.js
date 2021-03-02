const express = require('express')
const router = express.Router()

var settingsController = require('../controllers/settingsController')
const isAuth = require('../middlewares/is-auth')


// router.get('/settings', isAuth, settingsController.getPage)

router.get('/settings/grades/add', isAuth, settingsController.getPage)
router.post('/settings/grades/add', isAuth, settingsController.postAddGrade)
router.get('/settings/grades', isAuth, settingsController.getAllGrades)

router.get('/settings/allowances/add', isAuth, settingsController.getPage)
router.post('/settings/allowances/add', isAuth, settingsController.postAddAllowances)
router.get('/settings', isAuth, settingsController.getSettings)

router.get('/settings/grade/delete/(:id)', isAuth, settingsController.deleteGrade)
router.get('/settings/allowance/delete/(:id)', isAuth, settingsController.deleteAllowance)


router.post('/settings/allowance/edit/', isAuth, settingsController.editAllowance)
module.exports = router