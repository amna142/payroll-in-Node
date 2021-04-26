const fs = require('fs')
const csv = require('csv-parser');
const db = require('../util/database');
const Employee = db.employee
const timeEntries = require('../models/timeEntries');
const dateParser = require('node-date-parser');
const loadingSpinner = require('loading-spinner')
const EmployeeController = require('../controllers/employeeController')
const Attendance = db.attendance
const constants = require('../util/constants');
const TimeEntries = db.time_entries

exports.getAttendanceFile = (req, res, next) => {
	// console.log('req comes here', req.file)
	let filePath = req.file.path
	var entries = []
	fs.createReadStream(filePath)
		.pipe(csv())
		.on('data', (row) => {
			loadingSpinner.start(100, {
				clearChar: true
			});
			entries.push(row)
		})
		.on('end', () => {
			let time_entries = this.attendanceMappingObject(entries)
			console.log('time_entries', JSON.stringify(time_entries))
			let attendance = getAttendanceRecords(time_entries)
			attendanceEntries(attendance.tempAttendance, attendance.checkingTimes, res)
			// create bulk entries in attendnace table
			console.log('CSV file successfully processed');
		});
}


exports.attendanceMappingObject = (entries) => {
	//here comes a mapping object array of attendnace
	var time_entries = [];
	var timeEntries = [];
	var attendance_record = [];
	var workingHours = [];
	var tempEmp = entries[0].Name;
	var tempDate = entries[0].Date;
	entries.forEach(entry => {
		if (tempEmp != entry.Name) {
			let obj1 = {
				Date: tempDate,
				Working_hours: workingHours,
				timeEntries: timeEntries
			}
			attendance_record.push(obj1)
			timeEntries = [];
			workingHours = [];
			let obj2 = {
				Name: tempEmp,
				attendanceRecord: attendance_record
			}
			time_entries.push(obj2);
			attendance_record = []
		}

		if (tempEmp == entry.Name && tempDate != entry.Date) {

			let obj1 = {
				Date: tempDate,
				Working_hours: workingHours,
				timeEntries: timeEntries
			}
			attendance_record.push(obj1)
			timeEntries = [];
			workingHours = [];
		}
		timeEntries.push({
			checkIn: entry['Clock In'],
			checkOut: entry['Clock Out']
		})
		workingHours.push(entry['Work Time'])
		tempDate = entry.Date;
		tempEmp = entry.Name;
	});

	let obj1 = {
		Date: tempDate,
		Working_hours: workingHours,
		timeEntries: timeEntries
	}
	attendance_record.push(obj1)
	let obj2 = {
		Name: tempEmp,
		attendanceRecord: attendance_record
	}
	time_entries.push(obj2);
	return time_entries
}


let getAttendanceRecords = (time_entries) => {
	let tempAttendance = []
	let checkingTimes = []
	time_entries.forEach(element => {
		let entries = element.attendanceRecord
		entries.forEach(entry => {
			tempAttendance.push({
				machine_attendance_id: element.Name,
				date: entry.Date
			})
			//here create array of time entries
			checkingTimes.push({
				timeEntries: entry.timeEntries,
				working_hours: entry.Working_hours
			})
		});
	})
	return {
		checkingTimes: checkingTimes,
		tempAttendance: tempAttendance
	}
}


let attendanceEntries = (attendance, times, res) => {
	let temp = []
	Attendance.bulkCreate(attendance, {
		returning: true
	}).then(result => {
		if (!result) {
			console.log('bulkCreate not workd in attendanceEntries')
		}
		if (result.length === times.length) {

			//here create Bulk entries of time
			for (let i = 0; i < times.length; i++) {
				let timeEntries = times[i].timeEntries
				for (let j = 0; j < timeEntries.length; j++) {
					let hoursSum = 0;
					let splitcolon = times[i].working_hours[j].split(":");
					let hours = parseFloat(splitcolon[0]);
					let minutes = splitcolon[1];
					minutes = parseFloat(minutes) / 60;
					hoursSum = (hoursSum + hours + minutes);
					temp.push({
						attendanceId: result[i].id,
						check_in: formatAMPM(timeEntries[j].checkIn),
						check_out: formatAMPM(timeEntries[j].checkOut),
						work_time: Math.round(hoursSum)
					})
				}
			}
			//create bulk time entries against attendance
			TimeEntries.bulkCreate(temp, {
				returning: true
			}).then(result => {
				if (result) {
					//get all attendance entries to show on attendance page
					res.redirect('/attendance')
				}
			}).catch(err => {
				console.log('err in createing bulk Create Time Entries', err)
			})
		}

		// console.log('result of attendanceEntries', JSON.stringify(temp))

	}).catch(err => {
		console.log('error in attendanceEntries', err)
	})
}


exports.getAttendance = async (req, res) => {
	let entries;
	let user = await EmployeeController.EmployeeDesignation(req)
	if (user.designation_type == 'HR' || req.session.user.role.title === 'admin') {
		entries = await this.getAllAttendanceEntries()
	} else {
		entries = await getEmployeeAttendance(req.session.user.attendMachineId)
	}
	res.render('attendance', {
		attendance: entries,
		name: req.session.user.name,
		navigation: {
			role: user.role,
			pageName: constants.attendance
		},
	})
}

function formatAMPM(time) {
	time = time.toLowerCase();

	if (time.includes('leave')) {
		return time
	} else if (time === '' || time === undefined || time === null) {
		let time = '0:00'
		return time
	} else {
		var hours = time.split(':')[0];
		var minutes = time.split(':')[1];
		var ampm = hours >= 12 ? 'pm' : 'am';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		minutes = minutes < 10 ? minutes : minutes;
		var strTime = hours + ':' + minutes + ' ' + ampm;
		return strTime;
	}
}


exports.getAllAttendanceEntries = () => {
	let tempArr = []
	return Attendance.findAll({
		attributes: ['id', 'date', 'machine_attendance_id'],
		include: [{
			model: TimeEntries,
			attributes: ['id', 'check_out', 'check_in', 'attendanceId', 'work_time']
		}]
	}).then(result => {
		if (result) {
			console.log('result amna', JSON.stringify(result))
			result.forEach(element => {
				let entries = element.dataValues.time_entries
				entries.forEach(timeEntry => {
					let obj = {}
					obj['check In'] = timeEntry.check_in
					obj['check Out'] = timeEntry.check_out
					obj['work Time'] = timeEntry.work_time
					obj['date'] = dateParser.parse('Y-m-d', element.dataValues.date)
					obj['machine_attendance_id'] = element.dataValues.machine_attendance_id
					tempArr.push(obj)
				});
			});
		}
		return tempArr
	}).catch(err => {
		console.log('err', err)
	})
}



let getEmployeeAttendance = (attendanceId) => {
	console.log('attendanceId', attendanceId)
	let tempArr = []
	return Attendance.findAll({
		attributes: ['id', 'date', 'machine_attendance_id'],
		where: {
			machine_attendance_id: attendanceId
		},
		include: [{
			model: TimeEntries,
			attributes: ['id', 'check_out', 'check_in', 'attendanceId', 'work_time']
		}]
	}).then(result => {
		if (result) {
			result.forEach(element => {
				let entries = element.dataValues.time_entries
				entries.forEach(timeEntry => {
					let obj = {}
					obj['check In'] = timeEntry.check_in
					obj['check Out'] = timeEntry.check_out
					obj['work Time'] = timeEntry.work_time
					obj['date'] = dateParser.parse('Y-m-d', element.dataValues.date)
					obj['machine_attendance_id'] = element.dataValues.machine_attendance_id
					tempArr.push(obj)
				});
			});
		}
		// console.log('result', JSON.stringify(tempArr))
		return tempArr
	}).catch(err => {
		console.log('err', err)
	})
}


exports.AttendanceEntries = () => {
	return Attendance.findAll({
		attributes: ['id', 'date', 'machine_attendance_id'],
		include: [{
			model: TimeEntries,
			attributes: ['id', 'check_out', 'check_in', 'attendanceId', 'work_time']
		}]
	}).then(result => {
		if (result) {
			return result
		}
	}).catch(err => {
		console.log('err in AttendanceEntries', err)
	})
}