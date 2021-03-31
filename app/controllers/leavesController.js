


const EmployeeController = require('../controllers/employeeController')
const ENUM = require('../util/constants')
exports.getLeaves = (req, res) =>{
	let user  = EmployeeController.isEmployee(req)
	res.render('leaves', {
		name: req.session.user.name,
		isEmployee: user.isEmployee,
		navigation: {
			role: user.role,
			pageName: ENUM.leave_prefernces
		},
	})
}