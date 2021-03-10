


const db = require("../util/database")
const EmployeeFunds = db.employee_funds



exports.createEmpFunds = (funds) => {
	let arr = []
	return EmployeeFunds.bulkCreate(funds, {
		returning: true
	}).then((funds) => {
		console.log('allowances in bulk', JSON.stringify(funds))
	}).catch(err => {
		console.log('err in createEmpAllowances', err)
	})
}