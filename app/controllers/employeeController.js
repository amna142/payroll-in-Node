const db = require("../util/database")
const Allowance = db.allowances
const Fund = db.company_funds
const Employee = db.employee
const Role = db.role
const EmployeeType = db.employee_type
const EmployeeDesignation = db.employee_designation
const EmployeeGrade = db.employee_grade
const EmployeeAllowances = db.employee_allowances
const EmployeeFunds = db.employee_funds
const EmployeeSalary = db.salaries
exports.getAllGrades = () => {
	let employee_grades = []
	return db.employee_grade.findAll({
		include: [{
			model: Allowance,
			as: 'allowances',
			attributes: ['id', 'name', 'description', 'amount'],
			through: {
				attributes: []
			}
		}, {
			model: Fund,
			as: 'funds',
			attributes: ['id', 'name', 'description', 'amount'],
			through: {
				attributes: []
			}
		}]
	}).then(grades => {
		if (grades.length > 0) {
			grades.forEach(element => {
				employee_grades.push(element.dataValues)
			});
		}
		return employee_grades
	}).catch(err => {
		console.log('err in fetching grades', err)
	})
}

exports.findGradeById = (id) => {
	return db.employee_grade.findOne({
		where: {
			id: id
		}
	}).then(result => {
		return result.dataValues
	}).catch(err => {
		console.log('err', err)
	})
}

exports.findEmployeeById = (id) => {
	return Employee.findByPk(id, {
		include: [{
			model: Role
		}, {
			model: EmployeeDesignation
		}, {
			model: EmployeeType
		}, {
			model: EmployeeGrade
		}, {
			model: EmployeeSalary,
			include: [{
					model: EmployeeAllowances
				},
				{
					model: EmployeeFunds
				}
			]
		}]
	}).then(employee => {
		console.log('employee found', JSON.stringify(employee))
		return JSON.stringify(employee)
	}).catch(err => {
		console.log('errpr while finding employee', err)
	})
}