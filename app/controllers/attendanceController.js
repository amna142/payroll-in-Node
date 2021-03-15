const fs = require('fs')
const csv = require('csv-parser');
exports.getAttendanceFile = (req, res, next) => {
	let entries = [], time_entries = [], attendance_record=[]
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
			entries.forEach(entry => {
				if(tempEmp!=entry.Name){
					let obj1 = { 
						timeEntries: [{
							checkIn: entry['Clock In'],
							checkOut: entry['Clock Out']
						}]
					}
					attendance_record.push(obj1)
					let obj2 = {
						Name: entry.Name,
						Date: entry.Date,
						Working_hours: entry['Work Time'],
						attendanceRecord: attendance_record
					}
					time_entries.push(obj2);
					attendance_record = []
				}
				if(tempEmp == entry.Name && tempDate!=entry.Date){
					let obj1 = { 
						timeEntries: [{
							checkIn: entry['Clock In'],
							checkOut: entry['Clock Out']
						}]
					}
					attendance_record.push(obj1)
				}
				tempDate = entry.Date;
				tempEmp = entry.Name;

				
			});
			console.log('attendance_record', attendance_record)
			console.log('time_entries', time_entries)

			console.log('CSV file successfully processed');
		});
}