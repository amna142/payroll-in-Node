const fs = require('fs')
const csv = require('csv-parser');
const db = require('../util/database');
const timeEntries = require('../models/timeEntries');
const Attendance = db.attendance
const TimeEntries = db.time_entries

exports.getAttendanceFile = (req, res, next) => {
	let entries = [],
		time_entries = [],
		timeEntries = [],
		attendance_record = [],
		workingHours = []
	// console.log('req comes here', req.file)
	let filePath = req.file.path
	fs.createReadStream(filePath)
		.pipe(csv())
		.on('data', (row) => {
			entries.push(row)
		})
		.on('end', () => {
			// console.log('entries', entries)
			let tempDate = entries[0].Date;
			let tempEmp = entries[0].Name;
			//here comes a mapping object array of attendnace
			entries.forEach(entry => {
				if (tempEmp != entry.Name) {

					let obj2 = {
						Name: tempEmp,
						attendanceRecord: attendance_record
					}
					console.log('obj2', obj2)
					time_entries.push(obj2);

					attendance_record = []
					let times = {
						checkIn: entry['Clock In'],
						checkOut: entry['Clock Out']
					}
					workingHours.push(entry['Work Time'])
					timeEntries.push(times)
					let obj1 = {
						Date: entry.Date,
						Working_hours: workingHours,
						timeEntries: timeEntries

					}
					console.log('obj1', obj1)
					attendance_record.push(obj1)
					firstEntryFlag = 1
				}
				// console.log('time_entries', time_entries)
				else if (tempEmp == entry.Name && tempDate != entry.Date) {

					let obj1 = {
						Date: tempDate,
						Working_hours: workingHours,
						timeEntries: timeEntries
					}

					timeEntries = [];
					timeEntries.push({
						checkIn: entry['Clock In'],
						checkOut: entry['Clock Out']
					})
					workingHours = []
					workingHours.push(entry['Work Time'])
					attendance_record.push(obj1)
					firstEntryFlag = 1
				} else {
					timeEntries.push({
						checkIn: entry['Clock In'],
						checkOut: entry['Clock Out']
					})
					workingHours.push(entry['Work Time'])
				}
				tempDate = entry.Date;
				tempEmp = entry.Name;
				workingh = entry['Work Time']

			});
			// timeEntries.push({
			// 			checkIn:  entries[entries.length-1]['Clock In'],
			// 			checkOut: entries[entries.length-1]['Clock Out']

			// 		})
			// 		workingHours.push(entries[entries.length-1]['Work Time'])
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

			// console.log('attendance_record', JSON.stringify(attendance_record))
			// console.log('time_entries', JSON.stringify(time_entries))
			getAttendance()
			let attendance = getAttendanceRecords(time_entries)
			attendanceEntries(attendance.tempAttendance, attendance.checkingTimes, res)
			//create bulk entries in attendnace table

			console.log('CSV file successfully processed');
		});
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
	});
	console.log('checkingTimes', JSON.stringify(checkingTimes))
	// console.log('tempAttendance', JSON.stringify(tempAttendance))
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
		console.log('result.length === times.length', result.length)
		console.log('result.length === times.length', times.length)
		if (result.length === times.length) {

			//here create Bulk entries of time
			for (let i = 0; i < times.length; i++) {
				let hoursSum = 0;
				let timeEntries = times[i].timeEntries
				for (let j = 0; j < timeEntries.length; j++) {

					let splitcolon = times[i].working_hours[j].split(":");

					let hours = parseFloat(splitcolon[0]);
					let minutes = splitcolon[1];
					minutes = parseFloat(minutes) / 60;
					hoursSum = (hoursSum + hours + minutes);
					temp.push({
						attendanceId: result[i].id,
						check_in: timeEntries[j].checkIn,
						check_out: timeEntries[j].checkOut,
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
				console.log('result of bulk create TimeEntries', result)
			}).catch(err => {
				console.log('err in createing bulk Create Time Entries', err)
			})
		}

		// console.log('result of attendanceEntries', JSON.stringify(temp))

	}).catch(err => {
		console.log('error in attendanceEntries', err)
	})
}


exports.getAttendance = (req, res) =>{
	//
	let entries = getAllAttendanceEntries()
	if(entries){
		res.render('attendance',{
			attendance: entries
		})
	}
}



let getAllAttendanceEntries = () => {
	return Attendance.findAll({
		include: [{
			model: TimeEntries
		}]
	}).then(result => {
		console.log('result', JSON.stringify(result))
		return result
	}).catch(err => {
		console.log('err', err)
	})
}