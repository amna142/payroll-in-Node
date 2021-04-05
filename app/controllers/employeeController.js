const { template } = require('handlebars')
const Sequelize = require('sequelize')
const db = require("../util/database")
const Op = Sequelize.Op
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



exports.EmployeeResumeName = (id) => {
	return Employee.findByPk(id).then(result => {
		return result.dataValues.resume
	}).catch(err => {
		console.log('err in EmployeeResumeName', err)
	})
}


exports.isEmployee = (req) => {
	let user = req.session.user;
	let role;
	let isEmployee = false
	if (user.roleId === null) {
		isEmployee = true
		role = 'Employee'
	} else {
		isEmployee = false
		role = 'Admin'
	}
	return {
		role: role,
		isEmployee: isEmployee
	}
}


//employee having supervisors 
exports.employeeWithSupervisor = () => {
	let temp = []
	return Employee.findAll({
		where: {
			supervisor_email: {
				[Op.ne]: ""
			}
		},
		attributes: [
			[
				Sequelize.fn('DISTINCT', Sequelize.col('supervisor_email')), 'supervisor_email'
			]
		]
	}).then(result => {
		result.forEach(element => {
			temp.push(element.supervisor_email)
		});
		return temp
	}).catch(err => {
		console.log('err', err)
	})
}