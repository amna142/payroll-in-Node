const db = require("../util/database")
const Salaries = db.salaries


exports.createSalary = (empId, salaryAmount) => {
	return Salaries.create({
		employeeId: empId,
		amount: salaryAmount
	}).then(result => {
		console.log('salary record created', result.dataValues)
		//create employee aloowances and employee funds
	}).catch(err => {
		console.log('err', err)
	})
}