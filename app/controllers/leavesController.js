const EmployeeController = require('../controllers/employeeController')
const ENUM = require('../util/constants')
const db = require('../util/database')
const Employee = db.employee;
const Leaves = db.leaves;
const sequelize = require('sequelize')
const AttendanceController = require('../controllers/attendanceController')
const fs = require('fs')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const {
	send_email
} = require('../config/email.config');
const PreferencesController = require('./preferencesController');
const employeeLeaveBalance = db.employee_leave_balance;
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
	let statusId = await findLeaveStatusId('Pending')
	// search on employees to find if current_user_email is one of the supervisor's email
	let supervisor_found = await EmployeeController.isSupervisor(current_user_email, statusId.id)
	if (supervisor_found) {
		leave_requests = supervisor_found[current_user_email]
		console.log('super', JSON.stringify(supervisor_found))
	} else {
		console.log('No leave requests', JSON.stringify(supervisor_found))
	}
	//here comes leave status either rejected or accepted 
	let leaveHistory = await leave_history(req.session.user.email)
	console.log('leave_requests', JSON.stringify(leave_requests))

	let remaining_leaves = await EmployeeLeaveBalance(req.session.user.id)
	res.render('leaves', {
		name: req.session.user.name,
		email: current_user_email,
		phone: req.session.user.phone,
		isEmployee: user.isEmployee,
		leaveDetails: leaveHistory.length > 0 ? leaveHistory : null,
		leave_requests: leave_requests.length > 0 ? leave_requests : [],
		supervisor_email: req.session.user.supervisor_email,
		prefernces: leave_types,
		errorMessage: req.flash('error')[0],
		remaining_leaves: remaining_leaves,
		navigation: {
			role: user.role,
			pageName: ENUM.leave_prefernces,
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
	return LeaveRequest.findAll({
		attributes: ['id', 'from_date', 'to_date', 'comments', 'days_applied', 'rejected_by', 'rejection_reason', 'referal_reason', 'employeeId'],
		include: [{
				model: leaveRequestStatus,
				attributes: ['id', 'status']
			},
			{
				model: LeaveTypes,
				attributes: ['name', 'description']
			}
		]
	}).then(result => {
		// console.log('result of leave_history', JSON.stringify(leave_details))
		return result;
	}).catch(err => {
		console.log('err of leave_history', err)
	})
}


exports.postLeave = async (req, res, next) => {
	console.log('req.body', req.body)
	//calculate number of days 
	let from_date = new Date(req.body.from_date);
	let to_date = new Date(req.body.to_date)
	let time_difference = to_date.getTime() - from_date.getTime()
	let leave_days = Math.round((time_difference / (1000 * 3600 * 24)) + 1)
	console.log('leave_days', leave_days)
	let statusId = await findLeaveStatusId('Pending')
	console.log('statusId', statusId)
	let params = {
		leaveTypeId: req.body.leave_type,
		from_date: req.body.from_date,
		to_date: req.body.to_date,
		comments: req.body.comments,
		days_applied: leave_days,
		leaveRequestStatusId: statusId.id,
		employeeId: req.session.user.id
	}
	//check leaves if applied first on these dates
	let applied_leave = await LeaveIsAlreadyApplied(params.from_date, params.to_date, params.employeeId)
	console.log('applied_leave', applied_leave)
	if (applied_leave.length > 0) {
		//user can't apply another leave on same date
		req.flash('error', 'leave on dates already exits')
		res.redirect('/leaves')
	} else {
		// create leaves 
		console.log('i am creating new leave')
		LeaveRequest.create(params).then(result => {
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

}

let LeaveIsAlreadyApplied = async (from, to, empId) => {
	let pendingLeaveStatusId = await findLeaveStatusId('Pending')
	let acceptedLeaveStatusId = await findLeaveStatusId('Accepted')
	return Leaves.findAll({
		where: {
			employeeId: empId,
			[Op.and]: [{
				from_date: {
					[Op.between]: [new Date(from), new Date(to)]
				},
				to_date: {
					[Op.between]: [new Date(from), new Date(to)]
				}
			}],
			[Op.or]: [{
					leaveRequestStatusId: pendingLeaveStatusId.id
				},
				{
					leaveRequestStatusId: acceptedLeaveStatusId.id
				}
			]
		}
	}).then(result => {
		console.log('result of LeaveIsAlreadyApplied', JSON.stringify(result))
		return result
	}).catch(err => {
		console.log('err of LeaveIsAlreadyApplied', err)
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
	if (!HRObj) {
		req.flash('error', 'HR not added!');
		next();
		return;
	}
	HRObj.dataValues.employees.forEach(element => {
		HREmails.push(element.dataValues.email)
	});
	//find HR email
	let employeeObj = await EmployeeController.findByPk(leave_request_id)
	console.log('employeeObj', JSON.stringify(employeeObj))
	let statusId = await findLeaveStatusId('Accepted')
	console.log('sattus IS', JSON.stringify(statusId.id))
	//fetch employee leave balance
	let employee_leave_balance = await EmployeeLeaveBalance(employeeObj.employee.id)
	let balance = employee_leave_balance.remaining_leaves - employeeObj.days_applied
	console.log('employee_leave_balance amna', balance)
	LeaveRequest.update({
		leaveRequestStatusId: statusId.id,
		rejected_by: req.session.user.email
	}, {
		where: {
			id: leave_request_id
		}
	}).then(result => {
		if (result) {
			//after leave acceptance, deduct leaves from qouta if avaialable 
			employeeLeaveBalance.update({
					remaining_leaves: balance
				}, {
					where: {
						employeeId: employeeObj.employee.id
					}
				}

			).then(result => {
				console.log('result in employeeLeaveBalance', result)
				return result
			}).then(employee_leave_balance_id => {
				if (employee_leave_balance_id) {
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
				console.log('err in employeeLeaveBalance', err)
			})
			//id update completes, send email to approver and employee as well 
		}
	}).catch(err => {
		console.log('err of AcceptLeave', err)
	})
}

let EmployeeLeaveBalance = (id) => {
	console.log('employee id', id)
	return employeeLeaveBalance.findOne({
		attributes: ['total_leaves_allowed', 'remaining_leaves'],
		where: {
			employeeId: id
		},
		raw: true
	}).then(result => {
		console.log('result of EmployeeLeaveBalance', result)
		return result
	}).catch(err => {
		console.log('err of EmployeeLeaveBalance')
	})
}

exports.RejectLeave = async (req, res, next) => {
	console.log('req.body', req.body)
	let HREmails = []
	let HRObj = await EmployeeController.findHR();
	if (!HRObj) {
		req.flash('error', 'HR not added!');
		next();
		return;
	}
	HRObj.dataValues.employees.forEach(element => {
		HREmails.push(element.dataValues.email)
	});
	let employeeObj = await EmployeeController.findByPk(parseInt(req.body.leave_request_id))
	let statusId = await findLeaveStatusId('Rejected')
	console.log('statusId', statusId.id)
	//update status from leave table and insert rejection reason
	//now update leave with status and rejection reason
	let leaveStatusUpdate = updateLeaveApproveStatus(parseInt(req.body.leave_request_id), req.body.rejection_reason, req.session.user.email, statusId.id)
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


let updateLeaveApproveStatus = (leave_request_id, rejection_reason, name, statusId) => {
	return LeaveRequest.update({
		rejection_reason: rejection_reason,
		leaveRequestStatusId: statusId,
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

let findLeaveStatusId = (params) => {
	return leaveRequestStatus.findOne({
		attributes: ['id'],
		where: {
			status: params
		},
		raw: true
	}).then(result => {
		console.log('result in findAcceptedLeaveId', result.id)
		return result
	}).catch(err => {
		console.log('err in findAcceptedLeaveId', err)
	})
}


let totalLeaves = () => {
	return LeaveQouta.findAll({
		attributes: [
			[sequelize.fn('sum', sequelize.col('leaves_allowed')), 'total_leaves']
		],
		raw: true
	}).then(result => {
		console.log('result of totalLeaves', result)
		return result[0].total_leaves
	}).catch(err => {
		console.log('err of totalLeaves', err)
	})

}

exports.leaveBalance = async (employeeId) => {
	let leaveCount = await totalLeaves()

	//now create leave balance record
	if (leaveCount && employeeId) {
		return employeeLeaveBalance.create({
			employeeId: employeeId,
			total_leaves_allowed: leaveCount,
			remaining_leaves: leaveCount
		}).then(record => {
			console.log('rescord created', JSON.stringify(record))
			return record;
		}).catch(err => {
			console.log('err in employee leave balance creation', err)
		})
	} else {
		console.log('please provide leave preferneces')
	}
}


exports.deductSalary =async (req, res, next) => {
	let deduction = req.body.deduction;
	let id = req.body.id;
	let salary_after_deduction;
	deduction = deduction.split(':')[1]
	let leave_balance = await EmployeeLeaveBalance(id)
	if (!leave_balance) {
		res.send({
			status: 301,
			message: `Employee Leave Balance is null!`,
			data: null
		})
	} else {
		salary_after_deduction = (leave_balance.remaining_leaves - deduction)
		let deducted_record = await deductLeaveFromRecord(balance_after_deduction, id)
		console.log('deduction', deducted_record)
		res.send({
			status: 200,
			message: `${deduction} leaves are deducted successfully!`,
			data: deducted_record
		})
	}
}


exports.deductLeave = async (req, res, next) => {
	let deduction = req.body.deduction;
	let balance_after_deduction;
	deduction = deduction.split(':')[1]
	let id = req.body.id;
	let leave_balance = await EmployeeLeaveBalance(id)
	if (!leave_balance) {
		res.send({
			status: 301,
			message: `Employee Leave Balance is null!`,
			data: null
		})
	} else {
		balance_after_deduction = (leave_balance.remaining_leaves - deduction)
		let deducted_record = await deductLeaveFromRecord(balance_after_deduction, id)
		console.log('deduction', deducted_record)
		res.send({
			status: 200,
			message: `${deduction} leaves are deducted successfully!`,
			data: deducted_record
		})
	}
}

let deductLeaveFromRecord = (deduction, id) => {

	return employeeLeaveBalance.update({
		remaining_leaves: deduction,

	}, {
		where: {
			employeeId: id
		}
	}).then(result => {
		console.log('result of deductLeaveFromRecord', result)
		return result
	}).catch(err => {
		console.log('err of deductLeaveFromRecord', err)
	})
}