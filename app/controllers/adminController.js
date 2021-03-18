const db = require('../util/database')
const bcrypt = require('bcrypt')
const constants = require('../util/constants')
const email = require('../util/constants')
const fs = require('fs');
const nodeParser = require('node-date-parser')
const path = require('path')
const {
	transporter
} = require('../config/email.config')
const logsController = require('./logsController')
var oldRecord;
var AUDIT_LOGS = []
const employeeController = require('./employeeController')
const salariesController = require('./employeeSalaries')
const {
	employee
} = require('../util/database')
const {
	fileStorage
} = require('../middlewares/multer-file')
exports.adminHome = async (req, res) => {
	//get Cookie
	let logsArray = []
	console.log('isLoggedIn', req.session.isLoggedIn)
	var user = req.session.user;
	var isEmployee = false
	if (user.roleId === null) {
		logsArray = await logsController.employeeLogs(req.session.user.id)
		isEmployee = true
	} else {
		logsArray = await getLogs()
		isEmployee = false
	}
	res.render('admin/home', {
		isEmployee: isEmployee,
		isAuthenticated: req.session.isLoggedIn,
		navigation: {role: isEmployee ? 'Employee' :'Admin', pageName: constants.home},
		name: req.session.user.title,
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
	let logsArray = []
	let emp = await findAllEmployees()
	let employeesArray = []
	//get role of user to restrict access
	var user = req.session.user;
	var isEmployee = false
	if (user.roleId === null) {
		logsArray = await logsController.employeeLogs(req.session.user.id)
		isEmployee = true
	} else {
		logsArray = await logsController.getLogs()
		isEmployee = false
	}
	if (emp.length > 0) {
		let employee_designation, employee_type;
		for (var i = 0; i < emp.length; i++) {
			let unitEmployee = emp[i]
			//fetch employee designation
			employee_designation = await designation(unitEmployee.employeeDesignationId)
			employee_type = await type(unitEmployee.employeeDesignationId)
			//convert date 
			let convertedDOB = convertDate(unitEmployee.dob)
			let convertedHiringDate = convertDate(unitEmployee.starting_date)
			employeesArray.push({
				id: unitEmployee.id,
				name: unitEmployee.name,
				email: unitEmployee.email,
				phone: unitEmployee.phone,
				dob: convertedDOB,
				address: unitEmployee.address,
				hiring_date: convertedHiringDate,
				designation: employee_designation,
				employee_type: employee_type
			})
		}
		res.render('employee-management', {
			data: employeesArray,
			pageTitle: 'Employees',
			isEmployee: isEmployee,
			navigation: {role: isEmployee ? 'Employee' :'Admin', pageName: constants.employee},
			name: req.session.user.name,
			logsData: logsArray,
			errorMessage: req.flash('error').length > 0 ? req.flash('error')[0] : null
		})
	} else {
		res.render('employee-management', {
			data: employeesArray,
			pageTitle: 'Employees',
			isEmployee: isEmployee,
			name: req.session.user.name,
			navigation: {role: isEmployee ? 'Employee' :'Admin', pageName: constants.employee},
			logsData: logsArray,
			errorMessage: req.flash('error').length > 0 ? req.flash('error')[0] : null
		})
	}
}

function convertDate(d) {
	var date = new Date(d),
		mnth = ("0" + (date.getMonth() + 1)).slice(-2),
		day = ("0" + date.getDate()).slice(-2);
	return [date.getFullYear(), mnth, day].join("/");
}

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
	return db.employee_type.findOne({
		where: {
			id: id
		}
	}).then(result => {
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
	let user_role = employeeController.isEmployee(req)
	res.render('employee-management/add', {
		employeeTypes: employeeTypes,
		employeeDesignations: employeeDesignations,
		grades: grades,
		navigation: {role: user_role, pageName: constants.employee, pageExtension: constants.add},
	})
}

let employeeDesignation = function () {
	let empDesignations = []
	return db.employee_designation.findAll().then(designations => {
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
		employeeTypeId: parseInt(req.body.employee_type),
		employeeDesignationId: parseInt(req.body.designation),
		employeeGradeId: gradeId
	}
	if (Object.keys(params).length > 0) {
		Object.keys(params).forEach(function (key) {
			var value = params[key]
			console.log(key, value)
			AUDIT_LOGS.push({
				name: req.session.user.name,
				emp_id: req.session.user.id,
				date: convertDate(new Date()),
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
	var employeeFound = await findById(empId)
	oldRecord = employeeFound;
	let employeeDesignations = await employeeDesignation()
	let employeeTypes = await typesOfEmployeee();
	let des = await designation(employeeFound.designation)
	let employee_type = await type(employeeFound.type)
	var user = req.session.user;
	var isEmployee = false
	if (user.roleId === null) {
		isEmployee = true
	} else {
		isEmployee = false
	}
	console.log('employeeFound', employeeFound)
	let GRADE_OBJ = await employeeController.findGradeById(employeeFound.employee_grade_id)
	console.log('amna', GRADE_OBJ.grade + '(>' + GRADE_OBJ.min_salary + ',<' + GRADE_OBJ.max_salary + ')')
	if (employeeFound) {
		res.render('employee-management/edit', {
			pageTitle: 'Employee Edit Form',
			name: employeeFound.name,
			email: employeeFound.email,
			isEmployee: isEmployee,
			id: parseInt(empId),
			phone: employeeFound.phone,
			address: employeeFound.address,
			starting_date: convertDate(employeeFound.starting_date),
			file: employeeFound.file,
			grades: grades,
			dob: convertDate(employeeFound.dob),
			employeeTypes: employeeTypes,
			employeeDesignations: employeeDesignations,
			type: employee_type,
			designation: des,
			employee_grade: GRADE_OBJ.grade,
			errorMessage: req.flash('error').length > 0 ? req.flash('error')[0] : null
		})
	} else {
		console.log('No employee Found')
	}
}

exports.postEditEmployee = async (req, res) => {
	AUDIT_LOGS = []
	console.log('req.body', req.body)
	//convert old record date into new record date type
	oldRecord.dob = convertDate(oldRecord.dob)
	oldRecord.starting_date = convertDate(oldRecord.starting_date)
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
				date: convertDate(new Date()),
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
				console.log('employee', employee)
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
				//get role of user to restrict access
				var user = req.session.user;
				var userRole = false
				if (user.roleId === null) {
					userRole = true
				} else {
					console.log('userRole', userRole)
				}
				console.log('obj', {
					data: arr,
					pageTitle: 'Admins',
					isEmployee: userRole,
					name: req.session.user.name
				})
				res.render('admin-management', {
					data: arr,
					pageTitle: 'Admins',
					isEmployee: userRole,
					name: req.session.user.name,
					navigation: {role: userRole ? 'Employee' :'Admin', pageName: constants.admin},
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
		navigation: {role: user_role, pageName: constants.employee, pageExtension: employee.name},
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