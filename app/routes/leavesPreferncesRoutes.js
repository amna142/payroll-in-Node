const express = require('express')
const router = express.Router()
const leavePrefernces = require('../controllers/leavePreferencesController')
const isAuth = require('../middlewares/is-auth')
router.get('/leave_prefernces', isAuth, leavePrefernces.getLeaves)
router.get('/leave_prefernce/add', isAuth, leavePrefernces.getAddPrefrence)
router.post('/leave_prefernce/add', isAuth, leavePrefernces.postAddPrefrence)
module.exports = router