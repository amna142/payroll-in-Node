const EmployeeController = require('../controllers/employeeController')
const ENUM = require('../util/constants')
const handlebars = require('handlebars')
const {
	send_email
} = require('../config/email.config')
const db = require('../util/database')
const fs = require('fs')
const LeaveQouta = db.leave_qouta
const LeaveTypes = db.leave_types
const LeaveRequest = db.leaves

exports.getLeaves = async (req, res) => {
	let user = EmployeeController.isEmployee(req)
	let leave_types = await leave_prefernces()
	console.log('email', req.session.user)
	//get supervisors names and show in dropdown
	let supervisors = await EmployeeController.employeeWithSupervisor()
	console.log('EmployeeController.employeeWithSupervisor()', supervisors)
	res.render('leaves', {
		name: req.session.user.name,
		email: req.session.user.email,
		phone: req.session.user.phone,
		isEmployee: user.isEmployee,
		supervisors: supervisors,
		prefernces: leave_types,
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


exports.postLeave = (req, res, next) => {
	console.log('req.body', req.body)
	//calculate number of days 
	let from_date = new Date(req.body.from_date);
	let to_date = new Date(req.body.to_date)
	let time_difference = to_date.getTime() - from_date.getTime()
	let leave_days = Math.round(time_difference / (1000 * 3600 * 24))
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
	// create leaves 
	LeaveRequest.create(params).then(result => {
		console.log('result', result)
		//if created send email to the supervisor
		if (result) {
			send_email(
				req.session.user.supervisor_email,
				req.session.user.email,
				`Leave Request from ${req.session.user.name}`,
				`<p>Hello ${req.session.user.supervisor_email}, </br></p>
				<p>Hope you're doing fine. I (${req.session.user.name}) am Requesting a leave from <b>${req.body.from_date}</b> till  <b>${req.body.to_date}</b>.</p>
				<b> Reason For Leave</b>
				<p> ${req.body.comments}</p>
				<button > Approve </button> || <button> Reject </button> || <button> Refer </button>
				<p>Click this <a href="http://localhost:3000/leaves">link</a> to get Into the System</p> </br>
				<p>Best Regards</p>
				<b>${req.session.user.name}</b>`
			)
			// res.render('leaves')
		}
	}).catch(err => {
		console.log('err in postLeave', err)
	})
}

var readHTMLFile = function (path, callback) {
	fs.readFile(path, {
		encoding: 'utf-8'
	}, function (err, html) {
		if (err) {
			throw err;
			callback(err);
		} else {
			callback(null, html);
		}
	});
};