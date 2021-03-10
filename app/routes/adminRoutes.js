

const express = require('express')
const router = express.Router()
const adminController = require('../controllers/adminController')
const isAuth = require('../middlewares/is-auth')
//login -> Admin Request
router.get('/', isAuth, adminController.adminHome)
router.get('/employees', isAuth, adminController.employeesIndexPage)

//add requests

router.get('/employee/add', isAuth, adminController.getAddEmployee)
router.post('/employee/add', isAuth, adminController.postAddEmployee)


router.get('/employee/delete/(:id)', isAuth, adminController.getDeleteEmployee)

//edit requests
router.get('/employee/edit/(:id)', isAuth,  adminController.getEditEmployee)
router.post('/employee/edit/(:id)', isAuth, adminController.postEditEmployee)
router.get('/employee/view/(:id)', isAuth, adminController.viewEmployee)

//admin CRUD
router.get('/admins', adminController.getAdminIndexPage)


module.exports = router

