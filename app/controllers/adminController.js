const db = require('../util/database')
const bcrypt = require('bcrypt')

const email = require('../util/constants')
const {
	transporter
} = require('../config/email.config')

var beforeEdit;

exports.adminHome = (req, res) => {
	//get Cookie
	// console.log('session', req.session.user.name)
	console.log('isLoggedIn', req.session.isLoggedIn)
	res.render('admin/home', {
		isAuthenticated: req.session.isLoggedIn,
		name: req.session.user.title,
		errorMessage: req.flash('error')
	})
}

exports.employeesIndexPage = async (req, res) => {
	let emp = await findAllEmployees()
	let employeesArray = []
	console.log('emp', emp)
	if (emp.length > 0) {
		let employee_designation, employee_type;
		// console.log('employee', employee)

		// console.log('employee inside', employee.length)
		for (var i = 0; i < emp.length; i++) {
			let unitEmployee = emp[i]
			//fetch employee designation
			employee_designation = await designation(unitEmployee.employeeDesignationId)
			employee_type = await type(unitEmployee.employeeDesignationId)
			console.log('demployee_designationes', employee_designation)

			//convert date 
			let convertedDOB = convertDate(unitEmployee.dob)
			let convertedHiringDate = convertDate(unitEmployee.starting_date)
			console.log('convertedDOB', convertedDOB)
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
		console.log('employeesArray', employeesArray)
		//get role of user to restrict access
		var user = req.session.user;
		var isEmployee = false
		if (user.roleId === null) {
			isEmployee = true
		} else {
			console.log('user', user)
		}
		console.log('amna', isEmployee)
		res.render('employee-management', {
			data: employeesArray,
			pageTitle: 'Employees',
			isEmployee: isEmployee,
			name: req.session.user.name
		})
	} else {
		res.render('employee-management', {
			data: employeesArray,
			pageTitle: 'Employees',
			isEmployee: isEmployee,
			name: req.session.user.name
		})
	}
}

function convertDate(dob) {
	var date = new Date(dob),
		mnth = ("0" + (date.getMonth() + 1)).slice(-2),
		day = ("0" + date.getDate()).slice(-2);
	return [date.getFullYear(), mnth, day].join("/");
}

let findAllEmployees = (req, res) => {
	let empArray = []
	return db.employee.findAll({
		where: {
			roleId: null
		}
	}).then(employees => {

		employees.forEach(emp => {
			empArray.push(emp.dataValues)
		});
		console.log("employee found", empArray);
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
	db.employee.destroy({
		where: {
			id: emplId
		}
	}).then(() => {
		console.log('employee is destroyed')
		res.redirect('/employees')
	})
}

exports.getAddEmployee = async (req, res) => {
	//fetch employee type from DB
	let employeeDesignations = await employeeDesignation()
	console.log('employeeDesignations', employeeDesignations)
	let employeeTypes = await typesOfEmployeee();
	res.render('employee-management/add', {
		employeeTypes: employeeTypes,
		employeeDesignations: employeeDesignations
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
			console.log('employee found by email', employee.get({
				plain: true
			}))
			return false
		}
	})
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
			var beforeEdit = {
				id: emp.id,
				name: emp.name,
				email: emp.email,
				dob: emp.dob,
				address: emp.address,
				phone: emp.phone,
				hiring_date: emp.starting_date,
				resume: emp.resume,
				designation: emp.employeeDesignationId,
				type: emp.employeeTypeId
			}
			console.log('beforeEdit', beforeEdit)
			return beforeEdit
		}
	})
}

exports.postAddEmployee = async (req, res) => {
	console.log('params', req.body)
	var hashedPassword = bcrypt.hashSync(req.body.password, 8);
	console.log('hashedPassword', hashedPassword)
	var params = {
		email: req.body.email,
		name: req.body.name,
		password: hashedPassword,
		dob: req.body.dob,
		address: req.body.Address,
		phone: req.body.phone,
		starting_date: req.body.starting_date,
		resume: req.body.filePath,
		employeeTypeId: parseInt(req.body.employee_type),
		employeeDesignationId: parseInt(req.body.designation)
	}
	let value = await employeeByEmail(params.email)
	console.log(value)
	if (value) {
		// now add employee
		db.employee.create(params).then((employee) => {
			console.log('employee', employee)
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
	var empId = req.params.id
	console.log('edit employee', empId)
	var employeeFound = await findById(empId)
	beforeEdit = employeeFound;
	console.log('employeeFound', employeeFound)
	let employeeDesignations = await employeeDesignation()
	let employeeTypes = await typesOfEmployeee();
	let des = await designation(employeeFound.designation)
	let employee_type = await type(employeeFound.type)
	var user = req.session.user;
	var isEmployee = false
	if (user.roleId === null) {
		isEmployee = true
	} else {
		console.log('user', user)
	}
	console.log('isEmployee', isEmployee)
	if (employeeFound) {
		res.render('employee-management/edit', {
			pageTitle: 'Employee Edit Form',
			name: employeeFound.name,
			email: employeeFound.email,
			isEmployee: isEmployee,
			id: parseInt(empId),
			phone: employeeFound.phone,
			address: employeeFound.address,
			hiring_date: convertDate(employeeFound.hiring_date),
			file: employeeFound.resume,
			dob: convertDate(employeeFound.dob),
			employeeTypes: employeeTypes,
			employeeDesignations: employeeDesignations,
			type: employee_type,
			designation: des,
			errorMessage: req.flash('error').length > 0 ? req.flash('error')[0] : null
		})
	} else {
		console.log('No employee Found')
	}
}

exports.postEditEmployee = (req, res) => {
	console.log(' i am here')
	let employeeId = req.params.id;
	console.log('req.body', req.body)
	console.log('employeeId', employeeId)
	var afterEdit = {
		id: parseInt(employeeId),
		name: req.body.name,
		email: req.body.email,
		phone: req.body.phone,
		address: req.body.phone,
		starting_date: req.body.starting_date,
		dob: req.body.dob,
		filePath: req.body.filePath
	}
	var updatedObj = shallowEqual(afterEdit)
	console.log('uopdatedObj', updatedObj)
	if (Object.entries(updatedObj).length === 0) {
		console.log('You didnt updated anything')
		req.flash('error', 'You didnt updated anything. please update fields or move back')
		let message = req.flash('error')
		message = message.length > 0 ? message : null
		var user = req.session.user;
		var isEmployee = false
		if (user.roleId === null) {
			isEmployee = true
		} else {
			console.log('user', user)
		}
		res.render('employee-management/edit', {
			email: afterEdit.email,
			id: employeeId,
			name: afterEdit.name,
			phone: afterEdit.phone,
			isEmployee: isEmployee,
			address: afterEdit.address,
			filePath: afterEdit.filePath,
			dob: afterEdit.dob,
			hiring_date: afterEdit.starting_date,
			errorMessage: message
		})
	}
	if (updatedObj.hasOwnProperty('email')) {
		employeeByEmail(afterEdit.email).then(result => {
			console.log('result', result)
			if (result) {
				// Change everyone without a last name to "Doe"
				db.employee.update(updatedObj, {
					where: {
						id: afterEdit.id
					}
				}).then((updatedEmployee) => {
					if (updatedEmployee) {
						console.log("Done", updatedEmployee);
						res.redirect('/employees')
					} else {
						req.flash('error', 'Employee is Not Updated')
						console.log('not updated')
					}
				}).catch(err => {
					req.flash('error', 'Error in Updating Employee')
					console.log('error in updating object', err)
				})
			} else {
				console.log('Employee with the email already exist')
				req.flash('error', 'Employee with Email Already Exist. Please Try with some other Email')
				let message = req.flash('error')
				message = message.length > 0 ? message : null
				res.render('employee-management/edit', {
					email: afterEdit.email,
					id: employeeId,
					name: afterEdit.name,
					phone: afterEdit.phone,
					isEmployee: isEmployee,
					address: afterEdit.address,
					filePath: afterEdit.filePath,
					dob: afterEdit.dob,
					hiring_date: afterEdit.starting_date,
					errorMessage: message
				})
			}
		}).catch(err => {
			console.log('err', err)
		})
	} else {
		db.employee.update(updatedObj, {
			where: {
				id: afterEdit.id
			}
		}).then((updatedEmployee) => {
			if (updatedEmployee) {
				console.log("Done", updatedEmployee);
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

function shallowEqual(afterEdit) {
	var obj = {}
	const beforeKeys = Object.keys(beforeEdit);
	const beforeValues = Object.values(beforeEdit)
	const afterKeys = Object.keys(afterEdit);
	console.log('afterKeys', afterKeys)
	const afterValues = Object.values(afterEdit)
	key_value = ''
	if (beforeKeys.length !== afterKeys.length) {
		return false;
	}
	for (var i = 0; i < beforeValues.length; i++) {
		if (beforeValues[i] !== afterValues[i]) {
			key_value = afterKeys[i];
			console.log('key_Value', key_value)
			obj[key_value] = afterValues[i]
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
				console.log('arr', arr)
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
					name: req.session.user.name
				})
				// //roles are there but see if there's admin
			}
		}
	}).finally(() => {
		db.sequelize.close
	})
}