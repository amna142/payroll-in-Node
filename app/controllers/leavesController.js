


const EmployeeController = require('../controllers/employeeController')
const ENUM = require('../util/constants')
const db = require('../util/database')
const LeaveQouta = db.leave_qouta
const LeaveTypes = db.leave_types

exports.getLeaves = async (req, res) =>{
	let user  = EmployeeController.isEmployee(req)
	let leave_types = await leave_prefernces()
	res.render('leaves', {
		name: req.session.user.name,
		email: req.session.user.email,
		phone: req.session.user.phone,
		isEmployee: user.isEmployee,
		prefernces:  leave_types,
		navigation: {
			role: user.role,
			pageName: ENUM.leave_prefernces
		},
	})
}


let leave_prefernces = () => {
	return LeaveQouta.findAll({
		attributes: ['id', 'leaves_allowed'],
		include: [{
			model: LeaveTypes,
			attributes: ['id', 'name', 'description']
		}]
	}).then(result => {
		return result
	}).catch(err => {
		console.log('err in leave_prefernces', err)
	})
}


exports.postLeave = (req, res, next) =>{
	console.log('req.body', req.body)
	let params = {
		leaveTypeId: req.body.leave_type,
		from_date: req.body.from_date,
		to_date: req.body.to_date,
		comments: req.body.comments
	}
	//insert 
}