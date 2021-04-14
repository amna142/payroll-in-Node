const express = require('express')
const router = express.Router()
const adminController = require('../controllers/adminController')
const isAuth = require('../middlewares/is-auth')
const upload = require('../middlewares/multer-file').single('resume')
const uploadImage = require('../middlewares/multer-file').single('user_profile_image')
const EmployeeController = require('../controllers/employeeController')
//login -> Admin Request
router.get('/', isAuth, adminController.adminHome)
router.post('/user_profile_image', EmployeeController.postUserProfile)
router.post('/grade_salary_validation', EmployeeController.GradeSalaryValidation)
router.get('/employees', isAuth, adminController.employeesIndexPage)

router.post('/validate_dob', isAuth, EmployeeController.ValidateDOB)
//add requests

router.get('/employee/add', isAuth, adminController.getAddEmployee)
router.post('/employee/add', isAuth, upload, adminController.postAddEmployee)


router.get('/employee/delete/(:id)', isAuth, adminController.getDeleteEmployee)

//edit requests
router.get('/employee/edit/(:id)', isAuth, adminController.getEditEmployee)
router.post('/employee/edit/(:id)', isAuth, adminController.postEditEmployee)
router.get('/employee/view/(:id)', isAuth, adminController.viewEmployee)

//admin CRUD
router.get('/admins', adminController.getAdminIndexPage)

router.get('/employee/resume/(:id)', isAuth, adminController.getEmployeeResume)

module.exports = router