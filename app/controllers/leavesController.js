


const EmployeeController = require('../controllers/employeeController')
const ENUM = require('../util/constants')
const db = require('../util/database')
const LeaveQouta = db.leave_qouta
const LeaveTypes = db.leave_types
const LeaveRequest = db.leaves

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
	//calculate number of days 
	let from_date = new Date(req.body.from_date);



	let to_date = new Date(req.body.to_date)
	let time_difference = to_date.getTime() - from_date.getTime()
	let leave_days = Math.round(time_difference / (1000*3600*24))
	console.log('leave_days', leave_days)
	let params = {
		leaveTypeId: req.body.leave_type,
		from_date: req.body.from_date,
		to_date: req.body.to_date,
		comments: req.body.comments,
		days_applied: leave_days,
		leaveRequestStatusId: '3',
		employeeId: req.session.user.id
	}
	//create leaves 
	LeaveRequest.create(params).then(result=>{
		console.log('result', result)
		//if created send email to the supervisor

	}).catch(err=>{
		console.log('err in postLeave', err)
	})
}