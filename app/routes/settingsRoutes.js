const express = require('express')
const router = express.Router()

var settingsController = require('../controllers/settingsController')
const isAuth = require('../middlewares/is-auth')
router.get('/settings', isAuth, settingsController.getPage)

module.exports = router