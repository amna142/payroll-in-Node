const db = require("../util/database")



exports.insertLogs = (AUDIT_LOGS) => {
	console.log('AUDIT_LOGS', AUDIT_LOGS)
	AUDIT_LOGS.forEach(logObj => {
		db.logs.create(logObj).then(result => {
			console.log('result', result)
		}).catch(err => {
			console.log('err', err)
		})
	});
}


exports.getLogs = () => {
	let logsArray = []
	return db.logs.findAll().then(logArr => {
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