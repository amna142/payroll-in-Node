
const Sequelize = require('sequelize')
const fs = require('fs');
const path = require('path')
const isValidBirthdate = require('is-valid-birthdate');
const db = require("../util/database")
const LogsController = require('../controllers/logsController')
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
const EmployeeSalaries = db.salaries
const Leaves = db.leaves
const EmployeeSalary = db.salaries
exports.getAllGrades = () => {
	let employee_grades = []
	return db.employee_grade.findAll({
		where: {
			isInactive: 0
		},
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
		attributes: ['id', 'grade', 'min_salary', 'max_salary', 'isInactive'],
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


exports.EmployeeDesignation = (req) => {
	let userId = req.session.user.id;
	return Employee.findOne({
		attributes: ['id', 'name'],
		where: {
			id: userId
		},
		include: [{
				model: EmployeeDesignation,
				attributes: ['id', 'designation_type']
			},
			{
				model: Role,
				attributes: ['title']
			}
		]
	}).then(result => {
		return result.employee_designation
	}).catch(err => {
		console.log('err', err)
	})

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


exports.employeesUnderSupervisor = (supervisors) => {
	let temp = []
	Employee.findAll({
		where: {
			supervisor_email: supervisors
		},
		include: [{
			model: Leaves,
			where: {
				leaveRequestStatusId: 3
			}
		}]
	}).then(employeeWithLeaves => {
		console.log('result', JSON.stringify(employeeWithLeaves))
	}).catch(err => {
		console.log('err in employeesUnderSupervisor', err)
	})
}


exports.isSupervisor = (email_id, statusid) => {
	console.log('current user emaiil', email_id)
	let obj = {}
	return Employee.findAll({
		attributes: ['id', 'name', 'email'],
		where: {
			supervisor_email: {
				[Op.ne]: ""
			},
			supervisor_email: email_id,
		},
		include: [{
			model: Leaves,
			where: {
				leaveRequestStatusId: statusid,
			},
			attributes: ['id', 'from_date', 'to_date', 'comments', 'days_applied', 'leaveTypeId', 'leaveRequestStatusId']
		}]
	}).then(result => {
		result.forEach(element => {
			element.leaves.forEach(leave => {
				console.log('leave', leave)
				leave['from_date'] = getFormattedString(leave.from_date)
				leave['to_date'] = getFormattedString(leave.to_date)
			});
		})
		if (result.length > 0) {
			obj[email_id] = result
			console.log('obj amna', JSON.stringify(obj))
			return obj
		}
	}).catch(err => {
		console.log('err in isSupervisor', err)
	})
}
function getFormattedString(d){
  return d.getFullYear() + "-"+(d.getMonth()+1) +"-"+d.getDate()
  // for time part you may wish to refer http://stackoverflow.com/questions/6312993/javascript-seconds-to-time-string-with-format-hhmmss

}

exports.findByPk = (id) => {
	return Leaves.findByPk(id, {
		attributes: ['id', 'from_date', 'to_date', 'days_applied', 'comments'],
		include: [{
			model: Employee,
			attributes: ['id', 'name', 'email', 'phone', 'attendMachineId', 'supervisor_email']
		}]
	}).then(employee => {
		return employee
	}).catch(err => {
		console.log('err in findByPk employee', err)
	})
}


exports.findHR = () => {
	return EmployeeDesignation.findOne({
		attributes: ['id', 'designation_type'],
		where: {
			designation_type: 'HR',

		},
		include: [{
			model: Employee,
			attributes: ['id', 'name', 'email', 'supervisor_email'],
			where: {
				supervisor_email: {
					[Op.ne]: null
				}
			}
		}]
	}).then(result => {
		console.log('result', JSON.stringify(result))
		return result
	}).catch(err => {
		console.log('err in findHR', err)
	})
}

exports.findUser = (id) => {
	return Employee.findAll({
		attributes: ['id', 'name', 'email', 'phone', 'dob', 'address', 'starting_date'],
		where: {
			id: id
		},
		include: [{
				model: EmployeeDesignation,
				attributes: ['designation_type']
			},
			{
				model: EmployeeType,
				attributes: ['employee_type']
			}
		]
	}).then(result => {
		let currentEmployee = result[0].dataValues
		console.log()
		currentEmployee.employee_designation = currentEmployee.employee_designation.dataValues.designation_type;
		currentEmployee.employee_type = currentEmployee.employee_type.dataValues.employee_type;
		currentEmployee.starting_date = LogsController.convertDate(currentEmployee.starting_date)
		currentEmployee.dob = LogsController.convertDate(currentEmployee.dob)
		return result
	}).catch(err => {
		console.log('err in findCurrentUser', err)
	})
}

exports.ValidateDOB = (req, res) => {
	console.log('dob body', req.body)
	let dob = req.body.dob;
	if (!dob) res.json({
		status: 301,
		data: null,
		message: 'Unexpected error has occurred!'
	})
	else {
		let validate = isValidBirthdate(dob, {
			minAge: 18
		})
		console.log('validate dob', validate)
		if (validate) {
			res.json({
				status: 200,
				data: validate,
				message: 'Valid Date of Birth!'
			})
		} else {
			res.json({
				status: 400,
				data: null,
				message: 'invalid Date of Birth!'
			})
		}
	}
}
exports.postUserProfile = (req, res) => {
	console.log('req', req.body);
	var profileImg = req.body.userImgBase64;
	console.log('profileImg.length', profileImg.length);
	var ext = req.body.ext;
	console.log('ext', ext)
	if (!profileImg || !ext) res.json({
		status: 301,
		data: null,
		message: 'Unexpected error has occurred!'
	});

	else {
		const imgPth = `public/templates/${new Date().getMilliseconds()}.${ext}`;
		console.log('imgPath', typeof (imgPth));
		const buffer = Buffer.from(profileImg, "base64");
		fs.writeFile(buffer, 'base64', (err) => {
			if (err) {
				console.log('i am inside')
				console.log("err of postUserProfile", err);
				res.json(err)
			} else {
				console.log('i am outside');
				res.json(imgPth);
			}
		})
	}
}

exports.GradeSalaryValidation = async (req, res) => {
	console.log('req.body', req.body)
	let gradeId = req.body.grade;
	let salary = req.body.salary;
	//find grade min max range
	let salaryRange = await EmployeeGradeSalary(gradeId)
	console.log('salaryRange', salaryRange)
	if (salary >= salaryRange.min_salary && salary <= salaryRange.max_salary) {
		res.json({
			data: null,
			status: 200,
			message: 'success'
		})
	} else {
		res.json({
			data: null,
			status: 301,
			message: 'err'
		})
	}

}

let EmployeeGradeSalary = (gradeId) => {
	return EmployeeGrade.findOne({
		attributes: ['min_salary', 'max_salary'],
		where: {
			id: gradeId
		}
	}).then(result => {
		console.log('result', result.min_salary)
		return result
	}).catch(err => {
		console.log('err in EmployeeGradeSalary', err)
	})
}

exports.CurrentUserDesignation = (id) => {
	console.log('id', id)
	return EmployeeDesignation.findOne({
		attributes: ['designation_type'],
		where: {
			id: id
		}
	}).then(result => {
		// console.log('result in CurrentUserDesignation', result)
		return result
	}).catch(err => {
		console.log('err in CurrentUserDesignation', err)
	})
}

exports.findEmployeeSalary = (id) =>{
	return EmployeeSalaries.findOne({
		where: {
			employeeId: id
		}
	}).then(result=>{
		return result
	}).catch(err=>{
		console.log('err in findEmployeeSalary', err)
	})
}

exports.supervisorEmail = () =>{
	return Employee.findAll({
		attributes: ['email']
	}).then(result=>{
		console.log('result of supervisorEmail', JSON.stringify(result))
		return result
	}).catch(err=>{
		console.log('err of supervisorEmail', err)
	})
}


exports.findEmployeeId = (machine_attendance_id) => {
	return Employee.findOne({
		attributes: ['id'],
		where: {
			attendMachineId: machine_attendance_id
		},
		raw: true
	}).then(result=>{
		console.log('result of findEmployeeId', result)
		return result
	}).catch(err=>{
		console.log('err in findEmployeeId', err)
	})
}