const db = require("../util/database")



exports.createSalary = (empId, salaryAmount) => {
	db.salaries.create({
		employeeId: empId,
		amount: salaryAmount
	}).then(result => {
		console.log('salary record created', result.dataValues)
	}).catch(err => {
		console.log('err', err)
	})
}