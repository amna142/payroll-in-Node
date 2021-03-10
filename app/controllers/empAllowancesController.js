const db = require("../util/database")
const EmployeeAllownces = db.employee_allowances
const EmployeeFunds = db.employee_funds



exports.createEmpAllowances = (allowances) => {
	let arr = []
	return EmployeeAllownces.bulkCreate(allowances, {
		returning: true
	}).then((allowances) => {
		console.log('allowances in bulk', JSON.stringify(allowances))
	}).catch(err => {
		console.log('err in createEmpAllowances', err)
	})
}