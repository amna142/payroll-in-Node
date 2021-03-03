const express = require('express')
const router = express.Router()

var settingsController = require('../controllers/settingsController')
const isAuth = require('../middlewares/is-auth')


// router.get('/settings', isAuth, settingsController.getPage)
router.get('/settings/grades/add', isAuth, settingsController.getPage)
router.get('/settings', isAuth, settingsController.getSettings)

router.post('/settings/grades/add', isAuth, settingsController.postAddGrade)

router.post('/settings/allowances/add', isAuth, settingsController.postAddAllowances)
router.get('/settings/allowances/add', isAuth, settingsController.getPage)

router.get('/settings/grade/delete/(:id)', isAuth, settingsController.deleteGrade)
router.get('/settings/allowance/delete/(:id)', isAuth, settingsController.deleteAllowance)


router.post('/settings/allowance/edit/', isAuth, settingsController.editAllowance)
router.post('/settings/grade/edit/', isAuth, settingsController.editGrade)
module.exports = router