const express = require('express')
const router = express.Router()

var logsController = require('../controllers/logsController')
const isAuth = require('../middlewares/is-auth')
router.get('/logs', isAuth, logsController.getLogs)

module.exports = router