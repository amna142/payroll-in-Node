const db = require("../util/database")



exports.insertLogs = (AUDIT_LOGS) => {
	console.log('AUDIT_LOGS', AUDIT_LOGS)
	AUDIT_LOGS.forEach(logObj => {
		db.logs.create(logObj).then(result => {
			// console.log('result', result)
		}).catch(err => {
			console.log('err', err)
		})
	});
}


exports.getLogs = (considtion) => {
	let logsArray = []
	return db.logs.findAll({
		where: considtion
	}).then(logArr => {
		logArr.forEach(element => {
			logsArray.push(element.dataValues)
		});
		return logsArray
	}).catch(err => {
		console.log('err in logs', err)
	})
}


exports.employeeLogs = (id) => {
	let logsArray = []
	return db.logs.findAll({
		where: {
			emp_id: id
		}
	}).then(logArr => {
		logArr.forEach(element => {
			logsArray.push(element.dataValues)
		});
		return logsArray
	}).catch(err => {
		console.log('err in logs', err)
	})
}


exports.convertDate = (d) => {
	var date = new Date(d),
		mnth = ("0" + (date.getMonth() + 1)).slice(-2),
		day = ("0" + date.getDate()).slice(-2);
	return [date.getFullYear(), mnth, day].join("/");
}

exports.getTime = () => {
	var d = new Date()
	var hours = d.getHours()
	var minutes = d.getMinutes()
	var seconds = d.getSeconds()
	return (hours + ':' + minutes + ':' + seconds)
}