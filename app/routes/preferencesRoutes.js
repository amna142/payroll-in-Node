const express = require('express')
const router = express.Router()
const preference = require('../controllers/preferencesController')
const isAuth = require('../middlewares/is-auth')
router.get('/leave_preferences', isAuth, preference.getLeaves)
router.get('/leave_prefernce/add', isAuth, preference.getAddPrefrence)
router.post('/leave_prefernce/add', isAuth, preference.postAddPrefrence)


//company preference routes
router.get('/company_preferences', isAuth, preference.getCompanyPreferences)
router.post('/company_preferences', isAuth, preference.postCompanyPreferences)

module.exports = router