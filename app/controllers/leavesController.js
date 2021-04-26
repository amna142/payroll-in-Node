const EmployeeController = require('../controllers/employeeController')
const ENUM = require('../util/constants')
const db = require('../util/database')
const Employee = db.employee;
const Leaves = db.leaves;
const AttendanceController = require('../controllers/attendanceController')
const fs = require('fs')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const {
	send_email
} = require('../config/email.config');
const PreferencesController = require('./preferencesController');
const employeeLeaveBalance = require('../models/employeeLeaveBalance');
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
	// console.log('leaveHistory', JSON.stringify(leaveHistory))
	res.render('leaves', {
		name: req.session.user.name,
		email: current_user_email,
		phone: req.session.user.phone,
		isEmployee: user.isEmployee,
		leaveDetails: leaveHistory.length > 0 ? leaveHistory : null,
		leave_requests: leave_requests.length > 0 ? leave_requests : [],
		supervisor_email: req.session.user.supervisor_email,
		prefernces: leave_types,
		navigation: {
			role: user.role,
			pageName: ENUM.leave_prefernces
		},
		errorMessage: req.flash('error')[0]
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
	let leave_days = Math.round(time_difference / (1000 * 3600 * 24))
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

}

let LeaveIsAlreadyApplied = async (from, to, empId) => {
	let pendingLeaveStatusId = await findLeaveStatusId('Pending')
	let acceptedLeaveStatusId = await findLeaveStatusId('Accepted')
	console.log('from_date', new Date(from))
	console.log('to_date', new Date(to))
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
	HRObj.dataValues.employees.forEach(element => {
		HREmails.push(element.dataValues.email)
	});
	//find HR email
	let employeeObj = await EmployeeController.findByPk(leave_request_id)
	let statusId = await findLeaveStatusId('Accepted')
	console.log('sattus IS', JSON.stringify(statusId.id))
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
	let statusId = await findLeaveStatusId('Rejected')
	//update status from leave table and insert rejection reason
	//now update leave with status and rejection reason
	let leaveStatusUpdate = updateLeaveApproveStatus(parseInt(req.body.leave_request_id), req.body.rejection_reason, req.session.user.email, statusId)
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

let compareTimes = async (time) => {}


exports.CalculateLateComings = async (req, res) => {
	let date = req.body.month;
	let onLeaves = [];
	let count = 0;
	let lateByWH = [];
	let absentees = [];
	let OL = [];
	let lateComings = [];
	let startTimeLate = [];
	let company_settings = await PreferencesController.fetchDataFromCompanyPreferences();
	let office_start_time = company_settings.start_time;
	let office_working_hours = company_settings.working_hours;
	//get time entries of specific month
	var attendance_entries = await AttendanceController.AttendanceEntries()

	attendance_entries = weekendsOffDays(attendance_entries)

	attendance_entries = mappingObject(attendance_entries)
	if (attendance_entries.length > 0) {
		//late by Working Hours
		attendance_entries.forEach(entry => {
			let working_hours = 0;
			entry.attendanceRecord.forEach(element => {

				//**************Absence Deductions**************
				//Absence Deduction occurs when there's no leave of employee in employee Leave Record. 

				if (element.timeEntries[0].check_in.includes('leave') || element.timeEntries[0].check_in.includes('Leave') || element.timeEntries[0].check_in.includes('LEAVE')) {
					let isLeave = isLeaveApplied(entry.Name, element.Date)
					if (!isLeave) {
						absentees.push(entry)
					}
				}

				//Absent Deduction also occurs when HR writes Absent keyword in employee's clock In time entry on working days.
				if (element.timeEntries[0].check_in.includes('absent') || element.timeEntries[0].check_in.includes('Absent') || element.timeEntries[0].check_in.includes('ABSENT')) {
					absentees.push(entry)
				}

				//working hours per entry 

				element.timeEntries.forEach(time_entry => {
					working_hours = working_hours + time_entry.work_time
				});
				//***************Late Comings ***************

				//1. Employee is late if he comes after company specific clock In time
				//2. mployee is late if he doesn't complete company's specific Working hours in a day
				let late = lateByStartTime(element.timeEntries[0].check_in, office_start_time)
				late ? startTimeLate.push(entry) : (working_hours < office_working_hours) ? lateByWH.push(entry) : null


				//in OL clock in time is ignored but late coming will be decided on working hours.
				// If he/she can't complete company's specified working hours then he's late. This late will be added in late coming record. 
				if (element.timeEntries[0].check_in === 'OL') {
					if (working_hours < office_working_hours) {
						count++
						if (count > 3) {
							lateByWH.push(entry)
						}
					}
				}
			});


			lateComings.push({
				late_by_working_hours: lateByWH,
				late_by_checkIn_time: startTimeLate,
			})
		});

		console.log('lateByWH', JSON.stringify(onLeaves))
		res.send({
			status: 200,
			message: 'success!',
			data: lateComings
		})
	} else {
		res.send({
			status: 301,
			message: `Attendance Entries for ${date} doesn't exist`,
			data: null
		})
	}
}

let mappingObject = (entries) => {
	var attendance_entries = [];
	var timeEntries = [];
	var attendance_record = [];
	var tempEmp = entries[0].machine_attendance_id;
	var tempDate = entries[0].date;
	entries.forEach(entry => {
		if (tempEmp != entry.machine_attendance_id) {
			let obj1 = {
				Date: tempDate,
				timeEntries: timeEntries
			}
			attendance_record.push(obj1)
			timeEntries = [];
			workingHours = [];
			let obj2 = {
				Name: tempEmp,
				attendanceRecord: attendance_record
			}
			attendance_entries.push(obj2);
			attendance_record = []
		}

		if (tempEmp == entry.machine_attendance_id && tempDate != entry.date) {

			let obj1 = {
				Date: tempDate,
				timeEntries: timeEntries
			}
			attendance_record.push(obj1)
			timeEntries = [];
		}
		timeEntries = entry.time_entries
		tempDate = entry.date;
		tempEmp = entry.machine_attendance_id;
	});

	let obj1 = {
		Date: tempDate,
		timeEntries: timeEntries
	}
	attendance_record.push(obj1)
	let obj2 = {
		Name: tempEmp,
		attendanceRecord: attendance_record
	}
	attendance_entries.push(obj2);
	console.log('attendance_entries', JSON.stringify(attendance_entries))
	return attendance_entries

}

let isLeaveApplied = (name, date) => {
	console.log('entru.date', date)
	return Employee.findAll({
		attributes: ['id', 'attendMachineId'],
		where: {
			attendMachineId: name
		},
		include: [{
			model: Leaves,
			attributes: ['employeeId', 'from_date', 'to_date'],
			where: {
				from_date: {
					[Op.gte]: new Date(date)
				},
				to_date: {
					[Op.lte]: new Date(date)
				}
			}
		}]
	}).then(result => {
		console.log('isLeaveApplied', JSON.stringify(result))
		if (result) {
			if (result.leaves.length > 0) {
				return result
			}
		}
	}).catch(err => {
		console.log('err isLeaveApplied', err)
	})
}

let lateByStartTime = (time, office_start_time) => {
	let late = false
	let hours = office_start_time.split(':')[0]
	let minutes = office_start_time.split(':')[1]
	let hh = time.split(':')[0]
	let mm = time.split(':')[1]
	var timeZone = time.split(' ')[1]
	var office_timeZone = office_start_time.split(' ')[1]
	if (office_timeZone.toLower !== timeZone) {
		late = true
	} else if (hh < hours) {
		late = true
	} else if (mm < minutes) {
		late = true
	}
	return late ? late : false
}


let weekendsOffDays = (entries) => {
	var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	let weekendsOffArr = []
	entries.forEach(element => {
		var d = new Date(element.date);
		var dayName = days[d.getDay()];
		if (dayName !== 'Sunday') {
			element['day'] = dayName
			weekendsOffArr.push(element)
		}
	});
	return weekendsOffArr
	// console.log('weekendsOffArr', JSON.stringify(weekendsOffArr))
}


let findLeaveStatusId = (params) => {
	return leaveRequestStatus.findOne({
		attributes: ['id'],
		where: {
			status: params
		}
	}).then(result => {
		console.log('result in findAcceptedLeaveId', result.id)
		return result
	}).catch(err => {
		console.log('err in findAcceptedLeaveId', err)
	})
}

let acceptedLeaves = () => {
	let statusId = findLeaveStatusId('Accepted')
	if (statusId) {
		return Leaves.findAll({
			where: {
				leaveRequestStatusId: statusId
			}
		}).then(result => {
			console.log('result', JSON.stringify(result))
		}).catch(err => {
			console.log('err in acceptedLeaves', err)
		})
	}

}


exports.leaveBalance = async (employeeId) => {
	let totalLeavesAllowed = 0
	//calculate Total Leaves of an employee
	let total_leaves = await leave_prefernces()
	if (total_leaves.length > 0) {
		total_leaves.forEach(element => {
			totalLeavesAllowed = totalLeavesAllowed + element.leaves_allowed
		});
	} else {
		console.log('no leave preferences are added')
	}
	console.log('totalLeavesAllowed', totalLeavesAllowed)
	//now create leave balance record
	return employeeLeaveBalance.create({
		employeeId: employeeId,
		total_leaves_allowed: totalLeavesAllowed,
		remaining_leaves: totalLeavesAllowed
	}).then(record => {
		console.log('rescord created', record)
		return record;
	}).catch(err => {
		console.log('err in employee leave balance creation', err)
	})

}