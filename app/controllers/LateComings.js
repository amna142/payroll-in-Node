const PreferencesController = require('../controllers/preferencesController')
const AttendanceController = require('../controllers/attendanceController')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const EmployeeController = require('../controllers/employeeController')
const db = require('../util/database')
const Employee = db.employee
const Leaves = db.leaves
const constants = require('../util/constants')
const LateComings = db.late_comings

exports.CalculateLateComings = async (req, res, next) => {
	let date = req.body.month;
	let onLeaves = [];
	let count = 0;
	let lateByWH = [];
	let late_comings = [];
	let startTimeLate = [];
	var finalObj;
	let company_settings = await PreferencesController.fetchDataFromCompanyPreferences();
	let office_start_time = company_settings.start_time;
	let office_working_hours = company_settings.working_hours;
	//get time entries of specific month
	var attendance_entries = await AttendanceController.AttendanceEntries()
	if (attendance_entries.length == 0) {
		res.send({
			status: 404,
			message: `Attendance ENtries are null. Please upload attendnace first!`,
			data: null
		})
	} else {
		attendance_entries = weekendsOffDays(attendance_entries)
		attendance_entries = mappingObject(attendance_entries)
		if (attendance_entries.length > 0) {
			//late by Working Hours
			attendance_entries.forEach(entry => {
				let working_hours = 0;
				var absentees = [];
				entry.attendanceRecord.forEach(element => {

					let check_in = element.timeEntries[0].check_in.toLowerCase()
					if (check_in.includes('leave')) {
						onLeaves.push(element)
					} else if (check_in.includes('absent')) {
						absentees.push(element)
					} else {
						//1. Employee is late if he comes after company specific clock In time
						//2. mployee is late if he doesn't complete company's specific Working hours in a day
						let late = lateByStartTime(check_in, office_start_time)
						if (late) {
							startTimeLate.push(element)
						} else {
							let Working_hours_late = lateByWorkingHours(element.timeEntries, office_working_hours)
							if (Working_hours_late) {
								lateByWH.push(element)
							}
						}
					}
				});
				finalObj = {
					Name: entry.Name,
					leaves: onLeaves,
					absentees: absentees,
					lateByStartTime: startTimeLate,
					lateByWorkingHours: lateByWH,
					total_late_comings: startTimeLate.length + lateByWH.length
				}
				lateByWH = []
				startTimeLate = []
				absentees = []
				late_comings.push(finalObj)
				//insert into late coming record
				EmployeeController.findEmployeeId(finalObj.Name).then(employeeId => {
					if (employeeId === null) {
						res.send({
							status: 404,
							message: `No employee of machine attendance id ${finalObj.Name} exists. Please remove entries!`,
							data: null
						})
					} else {
						let result = addLateComings(finalObj, employeeId.id)
						if (result) {
							res.send({
								status: 200,
								message: 'Late Comings are calulated successfully!',
								data: late_comings
							})
						}
					}
				}).catch(err => {
					console.log('err', err)
				})
			});

		} else {
			res.send({
				status: 301,
				message: `Attendance Entries for ${date} doesn't exist`,
				data: null
			})
		}
	}
}
let addLateComings = (finalObj, employeeId) => {
	return LateComings.create({
		machine_attendance_id: finalObj.Name,
		total_late_comings: finalObj.total_late_comings,
		deducted_leaves: Math.round(((finalObj.total_late_comings) / 3)),
		employeeId: employeeId
	}).then(result => {
		console.log('result of addLateComings', result)
		if (!result) {
			req.flash('error', `late comings record isnt created for employee ${finalObj.Name}`);
			next()
			return;
		}
		return result
	}).catch(err => {
		console.log('err of addLateComings', err)
	})
}


let lateByWorkingHours = (timeEntries, office_working_hours) => {
	let working_hours = 0
	timeEntries.forEach(time_entry => {
		working_hours = working_hours + time_entry.work_time
	});
	if (working_hours < office_working_hours) {
		return time_entry
	}
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
	return attendance_entries
}


let isLeaveApplied = (name, date) => {
	let leaves = []
	console.log('date', new Date(date))
	return Employee.findAll({
		attributes: ['id', 'attendMachineId'],
		where: {
			attendMachineId: name
		},
		include: [{
			model: Leaves,
			attributes: ['employeeId', 'from_date', 'to_date'],
			// where: {
			// 	[Op.and]: [{
			// 		from_date: {
			// 			[Op.gte]: new Date(date)
			// 		},
			// 		to_date: {
			// 			[Op.lte]: new Date(date)
			// 		}
			// 	}],
			// }
		}]
	}).then(result => {
		console.log('isLeaveApplied', JSON.stringify(result))
		result.forEach(element => {
			element.leaves.forEach(leave => {
				if ((leave.from_date >= new Date(date)) && (leave.to_date <= new Date(date))) {
					leaves.push(element)
				}
			});
		});
		console.log('leaves', JSON.stringify(leaves))
		// return result
	}).catch(err => {
		console.log('err isLeaveApplied', err)
	})
}

let lateByStartTime = (time, office_start_time) => {
	let late = false
	let office_hours = office_start_time.split(':')[0]
	let office_minutes = office_start_time.split(':')[1]
	let check_in_hours = time.split(':')[0]
	let check_in_minutes = time.split(':')[1]
	var timeZone = time.split(' ')[1].toLowerCase()
	var office_timeZone = office_start_time.split(' ')[1].toLowerCase()
	if (office_timeZone !== timeZone || parseInt(check_in_hours) > parseInt(office_hours) || (parseInt(check_in_hours) == parseInt(office_hours)) && parseInt(check_in_minutes) > parseInt(office_minutes)) {
		late = true
	}
	return late
}

let findAllLateComingsRecord = () => {
	return LateComings.findAll({
		attributes: ['id', 'machine_attendance_id', 'total_late_comings', 'deducted_leaves'],
		raw: true
	}).then(result => {
		console.log('result of findAllLateComingsRecord', JSON.stringify(result))
		return result
	}).catch(err => {
		console.log('err of findAllLateComingsRecord', err)
	})
}

exports.getEmployeeLateComings = (employeeId) => {
	return LateComings.findAll({
		attributes: ['machine_attendance_id', 'total_late_comings', 'deducted_leaves'],
		where: {
			machine_attendance_id: employeeId
		},
		raw: true
	}).then(result => {
		console.log('result of getEmployeeLateComings', result)
		return result
	}).catch(err => {
		console.log('err of getEmployeeLateComings', err)
	})
}

exports.getLateComings = async (req, res, next) => {
	let late_comings = []
	let user = await EmployeeController.EmployeeDesignation(req)
	if (user.designation_type == 'HR' || req.session.user.role.title === 'admin') {
		late_comings = await findAllLateComingsRecord()
	} else {
		late_comings = await this.getEmployeeLateComings(req.session.user.attendMachineId)
	}
	res.render('lateComings', {
		late_comings: late_comings,
		name: req.session.user.name,
		navigation: {
			role: user.role,
			pageName: constants.attendance
		},
	})
}