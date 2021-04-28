const Op = require('sequelize').Op;
const db = require('../util/database')
const bcrypt = require('bcrypt')
const constants = require('../util/constants')
const email = require('../util/constants')
const fs = require('fs');
const isValidBirthdate = require('is-valid-birthdate')
const LeavesController = require('../controllers/leavesController')
const nodeParser = require('node-date-parser')
const {
	transporter
} = require('../config/email.config')
const logsController = require('./logsController')
var oldRecord;
var AUDIT_LOGS = []
const employeeController = require('./employeeController')
const salariesController = require('./employeeSalaries');
const {
	employee_designation
} = require('../util/database');
exports.adminHome = async (req, res) => {
	//get Cookie
	let logsArray = []
	console.log('isLoggedIn', req.session.isLoggedIn)
	let isUser = employeeController.isEmployee(req)
	if (isUser.role === 'Employee') {
		logsArray = await logsController.employeeLogs(req.session.user.id)
	} else {
		logsArray = await getLogs()
	}
	res.render('admin/home', {
		isEmployee: isUser.isEmployee,
		isAuthenticated: req.session.isLoggedIn,
		navigation: {
			role: isUser.role,
			pageName: constants.home
		},
		name: req.session.user.name,
		data: logsArray,
		errorMessage: req.flash('error')
	})
}

function getLogs() {
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
exports.employeesIndexPage = async (req, res) => {
	let logsArray = [];
	let emp = await findAllEmployees()
	let employeesArray = [],
		currentEmployee = []
	//get role of user to restrict access
	let isUser = employeeController.isEmployee(req)
	isUser.role === 'Employee' ? logsArray = await logsController.employeeLogs(req.session.user.id) : logsArray = await logsController.getLogs()

	var des = await designation(req.session.user.employeeDesignationId)
	console.log('designation', des)
	if (emp.length > 0) {
		var emp_designation, employee_type;
		if (isUser.isEmployee) {
			currentEmployee.push({
				id: req.session.user.id,
				name: req.session.user.name,
				email: req.session.user.email,
				phone: req.session.user.phone,
				dob: logsController.convertDate(req.session.user.dob),
				address: req.session.user.address,
				starting_date: logsController.convertDate(req.session.user.starting_date),
				employee_designation: await designation(req.session.user.employeeDesignationId),
				employee_type: await type(req.session.user.employeeTypeId)
			})
			console.log('currentUser', currentEmployee)
		}
		for (var i = 0; i < emp.length; i++) {
			let unitEmployee = emp[i]
			//fetch employee designation
			emp_designation = await designation(unitEmployee.employeeDesignationId)
			employee_type = await type(unitEmployee.employeeTypeId)
			//convert date 
			employeesArray.push({
				id: unitEmployee.id,
				name: unitEmployee.name,
				email: unitEmployee.email,
				phone: unitEmployee.phone,
				dob: logsController.convertDate(unitEmployee.dob),
				address: unitEmployee.address,
				starting_date: logsController.convertDate(unitEmployee.starting_date),
				employee_designation: emp_designation,
				employee_type: employee_type
			})
		}
		res.render('employee-management', {
			data: (isUser.isEmployee && des != 'HR') ? currentEmployee : employeesArray,
			designation: des,
			pageTitle: 'Employees',
			isEmployee: isUser.isEmployee,
			navigation: {
				role: isUser.role ? isUser.role : 'Employee',
				pageName: constants.employee
			},
			name: req.session.user.name,
			logsData: logsArray,
			errorMessage: req.flash('error').length > 0 ? req.flash('error')[0] : null
		})
	} else {
		res.render('employee-management', {
			data: employeesArray,
			pageTitle: 'Employees',
			isEmployee: isUser.isEmployee,
			name: req.session.user.name,
			navigation: {
				role: isUser.role,
				pageName: constants.employee
			},
			logsData: logsArray,
			errorMessage: req.flash('error').length > 0 ? req.flash('error')[0] : null
		})
	}
}

// function convertDate(d) {
// 	var date = new Date(d),
// 		mnth = ("0" + (date.getMonth() + 1)).slice(-2),
// 		day = ("0" + date.getDate()).slice(-2);
// 	return [date.getFullYear(), mnth, day].join("/");
// }

let findAllEmployees = (req, res) => {
	let empArray = []
	return db.employee.findAll({
		where: {
			roleId: null,
			isInactive: false
		}
	}).then(employees => {

		employees.forEach(emp => {
			empArray.push(emp.dataValues)
		});

		return empArray
	}).catch(err => {
		console.log('err', err)
	})
}

let type = (id) => {
	console.log('id for employee type', id)
	return db.employee_type.findOne({
		where: {
			id: id
		}
	}).then(result => {
		console.log("result", JSON.stringify(result))
		return result.dataValues.employee_type
	}).catch(err => {
		console.log('err', err)
	})
}


let designation = function (id) {
	return db.employee_designation.findOne({
		where: {
			id: id
		}
	}).then(result => {
		return result.dataValues.designation_type
	}).catch(err => {
		console.log('err', err)
	})
}

exports.getDeleteEmployee = (req, res) => {
	var emplId = req.params.id
	console.log('empId', emplId)
	db.employee.update({
		isInactive: true,
	}, {
		where: {
			id: emplId
		}
	}).then(() => {
		console.log('employee is destroyed')
		console.log('employee Id', req.session.user.id)
		AUDIT_LOGS.push({
			name: req.session.user.name,
			emp_id: req.session.user.id,
			date: new Date(),
			time: getTime(),
			action: constants.DELETE,
			record_type: 'Employee'
		})
		logsController.insertLogs(AUDIT_LOGS)
		res.redirect('/employees')
	})
}

exports.getAddEmployee = async (req, res) => {

	var grades = await employeeController.getAllGrades()
	//fetch employee type from DB
	let employeeDesignations = await employeeDesignation()
	let employeeTypes = await typesOfEmployeee();
	let user = employeeController.isEmployee(req)
	let supervisor_emails = await employeeController.supervisorEmail();
	res.render('employee-management/add', {
		employeeTypes: employeeTypes,
		employeeDesignations: employeeDesignations,
		grades: grades,
		name: req.session.user.name,
		attach_supervisor_emails: supervisor_emails.length>0 ? supervisor_emails : null,
		navigation: {
			role: user.role,
			pageName: constants.employee,
			pageExtension: constants.add
		},
	})
}

let employeeDesignation = function () {
	let empDesignations = []
	return db.employee_designation.findAll({
		where: {
			designation_type: {
				[Op.ne]: 'CEO'
			}
		}
	}).then(designations => {
		if (designations.length > 0) {
			designations.forEach(designationObj => {
				empDesignations.push(designationObj.dataValues)
			});
			return empDesignations;
		}
	}).catch(err => {
		console.log('err in fetching designations', err)
	})
}

let typesOfEmployeee = function () {
	let empTypes = []
	return db.employee_type.findAll().then(types => {
		if (types.length > 0) {
			types.forEach(typeObj => {
				empTypes.push(typeObj.dataValues)
			});
			return empTypes;
		}
	}).catch(err => {
		console.log('err in fetching designations', err)
	})
}


let employeeByEmail = function (email) {
	return db.employee.findOne({
		where: {
			email: email
		}
	}).then(employee => {
		if (employee === null) {
			console.log('employe not Found by EMail', employee)
			return true
		} else {
			console.log('employee found')
			return false
		}
	})
}

function getTime() {
	var d = new Date()
	var hours = d.getHours()
	var minutes = d.getMinutes()
	var seconds = d.getSeconds()
	return (hours + ':' + minutes + ':' + seconds)
}


function findById(empId) {
	return db.employee.findOne({
		where: {
			id: empId
		}
	}).then(employee => {
		if (!employee) {
			console.log('employe Not Found by id')
		} else {
			var emp = employee.get({
				plain: true
			})
			console.log('emp', emp)
			var beforeEdit = {
				id: emp.id,
				name: emp.name,
				email: emp.email,
				dob: emp.dob,
				address: emp.address,
				phone: emp.phone,
				starting_date: emp.starting_date,
				file: emp.resume,
				designation: emp.employeeDesignationId,
				type: emp.employeeTypeId,
				employee_grade_id: emp.employeeGradeId
			}
			return beforeEdit
		}
	})
}

exports.postAddEmployee = async (req, res) => {

	console.log('file params', req.file)
	console.log('req.body.machine_attendnace_id', req.body)
	let file = req.file
	var fileURL = file.path
	let gradeId = parseInt(req.body.employee_grade)
	var hashedPassword = bcrypt.hashSync(req.body.password, 8);
	var params = {
		email: req.body.email,
		name: req.body.name,
		password: hashedPassword,
		dob: req.body.dob,
		address: req.body.Address,
		phone: req.body.phone,
		starting_date: req.body.starting_date,
		resume: fileURL,
		supervisor_email: req.body.supervisor_email,
		employeeTypeId: parseInt(req.body.employee_type),
		employeeDesignationId: parseInt(req.body.designation),
		employeeGradeId: gradeId,
		attendMachineId: req.body.machine_attendance_id
	}
	//check if dob is validate 
	let validateDOB = isValidBirthdate(params.dob)
	console.log('validateDOB', validateDOB)
	if (Object.keys(params).length > 0) {
		Object.keys(params).forEach(function (key) {
			var value = params[key]
			console.log(key, value)
			AUDIT_LOGS.push({
				name: req.session.user.name,
				emp_id: req.session.user.id,
				date: new Date(),
				time: getTime(),
				action: constants.SET,
				record_type: 'Employee',
				field_id: key,
				new_value: value
			})
		})
	}
	let value = await employeeByEmail(params.email)
	console.log(value)
	if (value) {
	
		// now add employee
		db.employee.create(params).then((employee) => {
			console.log('employee created', employee)
			let empId = employee.dataValues.id
			
			LeavesController.leaveBalance(empId)
			//before employee creation, the create employee salary record
			salariesController.createSalary(empId, req.body.salary, gradeId)

			logsController.insertLogs(AUDIT_LOGS)
			res.redirect('/employees')
			return transporter.sendMail({
				to: email,
				from: email.FROM,
				subject: 'Employee Created',
				html: `
				<p>You Account has been Created</p>
				<p>Click this <a href="http://localhost:3000/login">link</a> to get Into the System</p>	`
			})
		})
	} else {
		console.log('employee already exist')
		req.flash('err', 'employee already exist')
		res.redirect('/employees')
	}
}


exports.getEditEmployee = async (req, res) => {
	var grades = await employeeController.getAllGrades()
	var empId = req.params.id
	console.log('empId', empId)
	var employeeFound = await findById(empId)
	oldRecord = employeeFound;
	let employeeDesignations = await employeeDesignation();
	let employeeTypes = await typesOfEmployeee();
	let employee_type = await type(employeeFound.type)
	let isUser = employeeController.isEmployee(req);
	console.log('req.session.user', req.session.user)
	let userDesignation = await employeeController.CurrentUserDesignation(req.session.user.employeeDesignationId)
	console.log('userDesignation', userDesignation)
	if (isUser.role === 'Employee') {
		logsArray = await logsController.employeeLogs(req.session.user.id)
	} else {
		logsArray = await getLogs()
	}
	let GRADE_OBJ = await employeeController.findGradeById(employeeFound.employee_grade_id)
	let empSalary = await employeeController.findEmployeeSalary(parseInt(empId))
	console.log('empSalary', empSalary.amount)
	if (employeeFound) {
		res.render('employee-management/edit', {
			pageTitle: 'Employee Edit Form',
			name: employeeFound.name,
			email: employeeFound.email,
			isEmployee: isUser.isEmployee,
			id: parseInt(empId),
			phone: employeeFound.phone,
			address: employeeFound.address,
			starting_date: logsController.convertDate(employeeFound.starting_date),
			file: employeeFound.file,
			grades: grades,
			salary: empSalary.amount,
			dob: logsController.convertDate(employeeFound.dob),
			employeeTypes: employeeTypes,
			employeeDesignations: employeeDesignations,
			type: employee_type,
			designation: userDesignation.dataValues.designation_type,
			navigation: {
				role: isUser.role,
				pageName: constants.employee,
				pageExtension: constants.UPDATE
			},
			name: req.session.user.name,
			employee_grade: GRADE_OBJ,
			errorMessage: req.flash('error').length > 0 ? req.flash('error')[0] : null
		})
	} else {
		console.log('No employee Found')
	}
}
exports.postEditEmployee = async (req, res) => {
	AUDIT_LOGS = []
	console.log('req.body', req.body)
	console.log('oldRecord', oldRecord)
	//convert old record date into new record date type
	oldRecord.dob = nodeParser.parse(oldRecord.dob)
	oldRecord.starting_date = nodeParser.parse(oldRecord.starting_date)
	console.log('oldRecord', oldRecord)
	let employeeId = req.params.id;
	var newRecord = {
		id: parseInt(employeeId),
		name: req.body.name,
		email: req.body.email,
		dob: req.body.dob,
		address: req.body.address,
		phone: req.body.phone,
		starting_date: req.body.starting_date,
		file: req.body.filePath,
		designation: oldRecord.designation,
		type: oldRecord.type,
	}
	console.log('newRecord', newRecord)
	var updatedObj = shallowEqual(newRecord)
	console.log('uopdatedObj', updatedObj)
	let employeeDesignations = await employeeDesignation()
	let employeeTypes = await typesOfEmployeee();
	let des = await designation(newRecord.designation)
	let employee_type = await type(newRecord.type)
	if (Object.keys(updatedObj).length === 0) {
		console.log('You didnt updated anything')
		req.flash('error', 'You didnt updated anything. please update fields or move back')
		let message = req.flash('error')
		message = message.length > 0 ? message : null
		var user = req.session.user;
		var isEmployee = false
		if (user.roleId === null) {
			isEmployee = true
		} else {
			isEmployee = false
		}
		newRecord['errorMessage'] = message
		newRecord['isEmployee'] = isEmployee
		newRecord['employeeDesignations'] = employeeDesignations;
		newRecord['employeeTypes'] = employeeTypes
		newRecord['type'] = employee_type
		newRecord['designation'] = des
		console.log('new record', newRecord)
		res.render('employee-management/edit', newRecord)
	} else {
		Object.keys(updatedObj).forEach(function (key) {
			var value = updatedObj[key]
			console.log(key, value)
			AUDIT_LOGS.push({
				name: req.session.user.name,
				emp_id: req.session.user.id,
				date: nodeParser.parse(new Date()),
				time: getTime(),
				action: constants.UPDATE,
				record_type: 'Employee',
				field_id: key,
				old_value: oldRecord[key],
				new_value: value
			})
		})
	}
	if (updatedObj.hasOwnProperty('email')) {
		let employee = await employeeByEmail(updatedObj.email)
		console.log('employeee found', employee)
		if (!employee) {
			console.log('Employee with the email already exist')
			req.flash('error', 'Employee with Email Already Exist. Please Try with some other Email')
			let message = req.flash('error')
			message = message.length > 0 ? message : null
			newRecord['errorMessage'] = message
			newRecord['isEmployee'] = isEmployee
			newRecord['employeeDesignations'] = employeeDesignations;
			newRecord['employeeTypes'] = employeeTypes
			newRecord['type'] = employee_type
			newRecord['designation'] = des
			res.render('employee-management/edit', newRecord)
		} else {
			db.employee.update(updatedObj, {
				where: {
					id: newRecord.id
				}
			}).then(result => {
				if (result) {
					logsController.insertLogs(AUDIT_LOGS)
					console.log('updated done', AUDIT_LOGS)
					res.redirect('/employees')
				} else {
					req.flash('error', 'Employee is Not Updated')
					console.log('not updated')
				}
			}).catch(err => {
				console.log('err in updating email', err)
			})
		}
	} else {
		db.employee.update(updatedObj, {
			where: {
				id: newRecord.id
			}
		}).then((updatedEmployee) => {
			if (updatedEmployee) {
				console.log("Done", updatedEmployee);
				logsController.insertLogs(AUDIT_LOGS)
				res.redirect('/employees')
			} else {
				req.flash('error', 'Employee is Not Updated')
				console.log('not updated')
			}
		}).catch(err => {
			req.flash('error', 'Error in Updating Employee')
			console.log('error in updating object', err)
		})
	}
}

function shallowEqual(newRecord) {
	var obj = {}
	const oldRecordKeys = Object.keys(oldRecord);
	const oldRecordValues = Object.values(oldRecord)
	const newRecordKeys = Object.keys(newRecord);
	const newRecordValues = Object.values(newRecord)
	console.log('oldRecordValues', oldRecordValues)
	console.log('newRecordValues', newRecordValues)
	key_value = ''
	if (oldRecordKeys.length !== newRecordKeys.length) {
		return false;
	}
	for (var i = 0; i < oldRecordValues.length; i++) {
		if (newRecordValues[i] !== undefined) {
			if (oldRecordValues[i] !== newRecordValues[i]) {
				key_value = newRecordKeys[i];
				console.log('key_Value', key_value)
				obj[key_value] = newRecordValues[i]
			}
		}
	}
	console.log('updatedFields', obj)

	return obj
}

exports.getAdminIndexPage = (req, res, next) => {

	return db.employee.findAll({
		include: [{
			model: db.role,
			where: {
				title: 'admin'
			}
		}]
	}).then(employee => {
		if (!employee) {
			console.log('no user found')
		} else {
			if (employee) {
				let arr = []
				for (var i = 0; i < employee.length; i++) {
					arr.push({
						name: employee[i].dataValues.name,
						email: employee[i].dataValues.email,
						password: employee[i].dataValues.password,
						id: employee[i].dataValues.id,
						roleId: employee[i].dataValues.roleId,
						roles: employee[i].dataValues.role.dataValues
					})
				}
				let user = employeeController.isEmployee(req)
				res.render('admin-management', {
					data: arr,
					pageTitle: 'Admins',
					isEmployee: user.role,
					name: req.session.user.name,
					navigation: {
						role: user.role,
						pageName: constants.admin
					},
				})
				// //roles are there but see if there's admin
			}
		}
	}).finally(() => {
		db.sequelize.close
	})
}


exports.viewEmployee = async (req, res) => {
	let employeeId = req.params.id
	console.log('employeeId', employeeId)
	//fetch employeeData against this Id
	let employee = await employeeController.findEmployeeById(employeeId)
	employee = JSON.parse(employee)

	employee.starting_date = logsController.convertDate(employee.starting_date)
	employee.dob = logsController.convertDate(employee.dob)
	let user_role = employeeController.isEmployee(req)
	res.render('employee-management/view', {
		employee: employee,
		name: req.session.user.name,
		navigation: {
			role: user_role.role,
			pageName: constants.employee,
			pageExtension: employee.name
		},
	})
}
exports.getEmployeeResume = async (req, res, next) => {
	let empId = parseInt(req.params.id)
	let resumePath = await employeeController.EmployeeResumeName(empId)
	console.log('resumePath', resumePath)
	let readStream = fs.createReadStream(resumePath);

	readStream.on('open', function () {
		// This just pipes the read stream to the response object (which goes to the client)
		readStream.pipe(res);
	});

	// This catches any errors that happen while creating the readable stream (usually invalid names)
	readStream.on('error', function (err) {
		res.end(err);
	});
}