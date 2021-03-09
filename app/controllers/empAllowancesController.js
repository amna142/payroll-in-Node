const db = require("../util/database")
const EmployeeAllownces = db.employee_allowances
const EmployeeFunds = db.employee_funds



exports.createEmpAllowances = (params, id) =>{
	return EmployeeAllownces.create().then(result=>{
		console.log('result', result)
	}).then(err=>{
		console.log('err in createEmpAllowances')
	})
}