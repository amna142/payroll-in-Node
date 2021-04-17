const EmployeeController = require('../controllers/employeeController')
const ENUM = require('../util/constants')
const db = require('../util/database')
const Employee = db.employee;
const AttendanceController = require('../controllers/attendanceController')
const fs = require('fs')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const {
	send_email
} = require('../config/email.config');
const PreferencesController = require('./preferencesController')
const LeaveQouta = db.leave_qouta
const LeaveTypes = db.leave_types
const LeaveRequest = db.leaves
const leaveRequestStatus = db.leave_request_status
exports.getLeaves = async (req, res) => {
	let leave_requests = []
	let user = EmployeeController.isEmployee(req)
	let leave_types = await leave_prefernces()
	console.log('email', req.session.user)
	let current_user_email = req.session.user.email
	// search on employees to find if current_user_email is one of the supervisor's email
	let supervisor_found = await EmployeeController.isSupervisor(current_user_email)
	if (supervisor_found) {
		leave_requests = supervisor_found[current_user_email]
		console.log('super', JSON.stringify(supervisor_found))
	} else {
		console.log('No leave requests', JSON.stringify(supervisor_found))
	}

	//here comes leave status either rejected or accepted 
	let leaveHistory = leave_history(req.session.user.email)
	res.render('leaves', {
		name: req.session.user.name,
		email: current_user_email,
		phone: req.session.user.phone,
		isEmployee: user.isEmployee,
		leave_requests: leave_requests.length > 0 ? leave_requests : [],
		supervisor_email: req.session.user.supervisor_email,
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


let leave_history = (user_email) => {
	console.log('user_email', user_email)
	return Employee.findAll({
		attributes: ['id', 'name', 'email', 'supervisor_email'],
		where: {
			email: user_email
		},
		include: [{
			model: LeaveRequest,
			attributes: ['id', 'from_date', 'to_date', 'comments', 'days_applied', 'rejected_by', 'rejection_reason', 'referal_reason', 'leaveTypeId'],
			include: [{
				model: leaveRequestStatus,
				attributes: ['id', 'status']
			}]
		}]
	}).then(result => {
		console.log('result of leave_history', JSON.stringify(result))
	}).catch(err => {
		console.log('err of leave_history', err)
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
		leaveRequestStatusId: '1',
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
			res.redirect('leaves')
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


exports.AcceptLeave = async (req, res, next) => {
	let HREmails = []
	let leave_request_id = req.params.id;
	console.log('leave_request_id', leave_request_id)
	let HRObj = await EmployeeController.findHR()
	HRObj.dataValues.employees.forEach(element => {
		HREmails.push(element.dataValues.email)
	});
	//find HR email
	let employeeObj = await EmployeeController.findByPk(leave_request_id)
	LeaveRequest.update({
		leaveRequestStatusId: 2
	}, {
		where: {
			id: leave_request_id
		}
	}).then(result => {
		if (result) {
			//id update completes, send email to approver and employee as well 
			send_email(
				employeeObj.employee.email,
				req.session.user.email,
				HREmails[0], //here HR email comes
				`Leave Request Approved for ${employeeObj.employee.name}`,
				`<p>Hello ${employeeObj.employee.name}, </br></p>
				<p>Hope you're doing fine. ${req.session.user.email} have approved leave from <b>${req.body.from_date}</b> till  <b>${req.body.to_date}</b>.</p>
				<b> Reason Employee Gave For Leave</b>
				<p> ${employeeObj.comments}</p>
				<p>this email has been CC to HR</p>
				<p>Best Regards</p>
				<b>${req.session.user.name}</b>`
			)
			res.redirect('/leaves')
		}
	}).catch(err => {
		console.log('err of AcceptLeave', err)
	})
}


exports.RejectLeave = async (req, res, next) => {
	console.log('req.body', req.body)
	let HREmails = []
	let HRObj = await EmployeeController.findHR()
	HRObj.dataValues.employees.forEach(element => {
		HREmails.push(element.dataValues.email)
	});
	let employeeObj = await EmployeeController.findByPk(parseInt(req.body.leave_request_id))
	//update status from leave table and insert rejection reason
	//now update leave with status and rejection reason
	let leaveStatusUpdate = updateLeaveApproveStatus(parseInt(req.body.leave_request_id), req.body.rejection_reason, req.session.user.email)
	// now send email that leave has been rejected
	if (leaveStatusUpdate) {
		send_email(
			employeeObj.employee.email, //to
			req.session.user.email, //from
			HREmails[0], //here HR email comes
			`Leave Request Rejected for ${employeeObj.employee.name}`,
			`<p>Hello ${employeeObj.employee.name}, </br></p>
				<p>Hope you're doing fine. ${req.session.user.name} have rejected leave from <b>${employeeObj.from_date}</b> till  <b>${employeeObj.to_date}</b>.</p>
				<b> Reason Employee Gave For Rejection</b>
				<p> ${req.body.rejection_reason}</p>
				<p>this email has been CC to HR</p>
				<p>Best Regards</p>
				<b>${req.session.user.name}</b>`
		)
		res.redirect('/leaves')
	}
}


let updateLeaveApproveStatus = (leave_request_id, rejection_reason, name) => {
	return LeaveRequest.update({
		rejection_reason: rejection_reason,
		leaveRequestStatusId: 3,
		rejected_by: name
	}, {
		where: {
			id: leave_request_id
		}
	}).then(result => {
		console.log('result of updateLeaveApproveStatus', result)
		if (result) {
			return result
		}
	}).catch(err => {
		console.log('err of updateLeaveApproveStatus', err)
	})
}



exports.CalculateLateComings = async (req, res) => {
	let date = req.body.month;
	let month = new Date(date).getMonth() + 1;
	let year = new Date(date).getFullYear();
	let company_settings = await PreferencesController.fetchDataFromCompanyPreferences();
	let office_start_time = company_settings.start_time;
	console.log('office_start_time', office_start_time)
	//get time entries of specific month
	var entries = await AttendanceController.AttendanceByMonthAndYear(month, year)
	if (entries.length > 0) {
		console.log('entries', JSON.stringify(entries))
		res.send({
			status: 200,
			message: 'success!',
			data: null
		})
	} else {
		res.send({
			status: 301,
			message: `Attendance Entries for ${date} doesn't exist`,
			data: null
		})
	}
}