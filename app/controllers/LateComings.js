const PreferencesController = require('../controllers/preferencesController')
const AttendanceController = require('../controllers/attendanceController')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const db = require('../util/database')
const Employee = db.employee
const Leaves = db.leaves

exports.CalculateLateComings = async (req, res) => {
	let date = req.body.month;
	let onLeaves = [];
	let count = 0;
	let lateByWH = [];
	let absentees = [];
	let lateComings = [];
	let startTimeLate = [];
	let company_settings = await PreferencesController.fetchDataFromCompanyPreferences();
	console.log('company_settings', company_settings)
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
				let check_in = element.timeEntries[0].check_in.toLowerCase()
				if (check_in.includes('leave')) {
					let isLeave = isLeaveApplied(entry.Name, element.Date)
					if (isLeave.length === 0) {
						absentees.push(entry)
					}
				}

				// //Absent Deduction also occurs when HR writes Absent keyword in employee's clock In time entry on working days.
				// if (check_in.includes('absent')) {
				// 	absentees.push(entry)
				// }

				// //working hours per entry 

				// element.timeEntries.forEach(time_entry => {
				// 	working_hours = working_hours + time_entry.work_time
				// });
				// //***************Late Comings ***************

				// //1. Employee is late if he comes after company specific clock In time
				// //2. mployee is late if he doesn't complete company's specific Working hours in a day
				// let late = lateByStartTime(element.timeEntries[0].check_in, office_start_time)
				// late ? startTimeLate.push(entry) : (working_hours < office_working_hours) ? lateByWH.push(entry) : null


				// //in OL clock in time is ignored but late coming will be decided on working hours.
				// // If he/she can't complete company's specified working hours then he's late. This late will be added in late coming record. 
				// if (element.timeEntries[0].check_in === 'OL') {
				// 	if (working_hours < office_working_hours) {
				// 		count++
				// 		if (count > 3) {
				// 			lateByWH.push(entry)
				// 		}
				// 	}
				// }
			});


			// lateComings.push({
			// 	late_by_working_hours: lateByWH,
			// 	late_by_checkIn_time: startTimeLate,
			// })
		});
		console.log('absentted', JSON.stringify(absentees))
		res.send({
			status: 200,
			message: 'success!',
			data: absentees
		})
	} else {
		res.send({
			status: 301,
			message: `Attendance Entries for ${date} doesn't exist`,
			data: null
		})
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
		return result
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