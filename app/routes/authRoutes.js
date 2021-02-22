const express = require('express')
const router = express.Router()

const authController = require('../controllers/authController')
const isAuth = require('../middlewares/is-auth')

//get login page
router.get('/login', authController.getLogin)

//login -> POST request for login into the system
router.post('/login', authController.postLogin)

router.post('/logout', isAuth, authController.postLogout)

router.get('/reset', authController.getReset)



router.post('/reset', authController.postReset)

router.get('/reset/:token', authController.getNewPassword)

router.post('/new-password', authController.postNewPassword)

module.exports = router