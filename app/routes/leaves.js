

const express = require('express')
const router = express.Router()
const LeavesController = require('../controllers/leavesController')
const isAuth = require('../middlewares/is-auth')
router.get('/leaves', isAuth, LeavesController.getLeaves)


module.exports = router