const db = require('../util/database')
const bcrypt = require('bcrypt')
exports.adminHome = (req, res) => {
	//get Cookie
	console.log('session', req.session.user.name)
	console.log('isLoggedIn', req.session.isLoggedIn)
	res.render('admin/home', {
		isAuthenticated: req.session.isLoggedIn,
		name: req.session.user.title,
		errorMessage: req.flash('error')
	})
}

exports.employeesIndexPage = (req, res) => {
	db.employee.findAll({
		where: {
			roleId: null
		}
	}).then(employee => {
		if (!employee) {
			console.log('no user found')
		} else {
			if (employee) {
				console.log('employee', employee)
				let employeesArray = []
				console.log('employee inside', employee.length)
				for (var i = 0; i < employee.length; i++) {
					let unitEmployee = employee[i].dataValues
					console.log('amna', unitEmployee)
					employeesArray.push({
						id: unitEmployee.id,
						name: unitEmployee.name,
						email: unitEmployee.email
					})
				}
				//get role of user to restrict access
				var user = req.session.user;
				var isEmployee = false
				if (user.roleId === null) {
					isEmployee = true
				}else {
				console.log('user', user)
				}
				console.log('amna', isEmployee)
				res.render('employee-management', {
					data: employeesArray,
					pageTitle: 'Employees',
					isEmployee: isEmployee,
					name: req.session.user.name
				})
				console.log('employeesArray', employeesArray)
				//roles are there but see if there's admin
			}
		}
	}).finally(() => {
		db.sequelize.close
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
	})
}

exports.getAddEmployee = (req, res) => {
	res.render('employee-management/add')
}

let employeeByEmail = function (email) {
	return db.employee.findOne({
		where: {
			email: email
		}
	}).then(employee => {
		console.log('employe Found by EMail', employee)
		if (employee === null) {
			return true
		} else {
			console.log('employee Already Exist', employee.get({
				plain: true
			}))
			return false
		}
	})
}

function findById(empId) {
	db.employee.findOne({
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
			console.log('emp', emp.email)
			var beforeEdit = {
				id: emp.id,
				name: emp.name,
				email: emp.email,
				password: emp.password
			}
			return beforeEdit
		}
	})
}

exports.postAddEmployee = async (req, res) => {
	console.log('params', req.body)
	var email = req.body.email
	var name = req.body.name
	var password = req.body.password
	let value = await employeeByEmail(email)
	console.log(value)
	if (value) {
		var hashedPassword = bcrypt.hashSync(password, 8);
		console.log('hashedPassword', hashedPassword)
		// now add employee
		db.employee.create({
			name: name,
			email: email,
			password: hashedPassword
		}).then((employee) => {
			console.log('employee', employee)
			res.redirect('/employees')
		})
	} else {
		console.log('employee already exist')
		res.redirect('/employees')
	}
}

exports.getEditEmployee = (req, res) => {
	var empId = req.params.id
	console.log('edit employee', empId)
	var employeeFound = findById(empId)
	console.log('employeeFound', employeeFound)
	if (employeeFound) {
		res.render('employee-management/edit', {
			pageTitle: 'Employee Edit Form',
			name: employeeFound.name,
			email: employeeFound.email,
			password: employeeFound.password,
			id: empId
		})
	}

}

exports.postEditEmployee = (req, res) => {
	let employeeId = req.params.id;
	console.log('employeeId', employeeId)
	var afterEdit = {
		id: employeeId,
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
	}
	// var changedValues = shallowEqual()

	// Change everyone without a last name to "Doe"
	// db.employee.update(changedValues, {
	// 	where: {
	// 		id: employeeId
	// 	}
	// }).then(() => {
	// 	console.log("Done");
	// 	res.redirect('/admin/employees')
	// })

}

function shallowEqual() {
	const beforeKeys = Object.keys(beforeEdit);
	const beforeValues = Object.values(beforeEdit)
	const afterKeys = Object.keys(afterEdit);
	const afterValues = Object.values(afterEdit)
	var updatedFields = [],
		key_value = ''
	if (beforeKeys.length !== afterKeys.length) {
		return false;
	}
	for (var i = 0; i < beforeValues.length; i++) {
		if (beforeValues[i] !== afterValues[i]) {
			key_value = afterKeys[i];
			updatedFields.push({
				key_value: afterValues[i]
			})
		}
	}
	console.log('updatedFields', updatedFields)

	return updatedFields
}
