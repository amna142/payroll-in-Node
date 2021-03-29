const EmployeeController = require('../controllers/employeeController')
const ENUM = require('../util/constants')
const db = require('../util/database')
const LeaveQouta = db.leave_qouta
const LeaveTypes = db.leave_types
exports.getLeaves = async (req, res, next) => {
	let user = EmployeeController.isEmployee(req)
	let preferences = await leave_prefernces()
	res.render('leavePrefernces', {
		name: req.session.user.name,
		isEmployee: user.isEmployee,
		preferences: preferences,
		navigation: {
			role: user.role,
			pageName: ENUM.leave_prefernces
		},
	})
}

let leave_prefernces = () => {
	return LeaveQouta.findAll({
		attributes: ['id', 'leaves_allowed'],
		include: [{
			model: LeaveTypes,
			attributes: ['id', 'name', 'description']
		}]
	}).then(result => {
		return result
	}).catch(err => {
		console.log('err in leave_prefernces', err)
	})
}

exports.getAddPrefrence = async (req, res, next) => {
	let user = EmployeeController.isEmployee(req)
	//get leave types from database
	let leave_types = await leaveTypes()
	console.log('leave_types', leave_types)
	res.render('leavePrefernces/add', {
		name: req.session.user.name,
		isEmployee: user.isEmployee,
		leave_types: leave_types,
		navigation: {
			role: user.role,
			pageName: ENUM.leave_prefernces,
			pageExtension: ENUM.add
		},
	})
}

let leaveTypes = () => {
	let tempArr = []
	return LeaveTypes.findAll({
		attributes: ['id', 'name', 'description']
	}).then(result => {
		result ? result.forEach(element => {
			tempArr.push(element.dataValues)
		}) : console.log('no leave types in database')
		return tempArr
	}).catch(err => {
		console.log('err in leaveTypes', err)
	})
}

exports.postAddPrefrence = (req, res, next) => {
	console.log('req body', req.body)
	let params = {
		leaveTypeId: req.body.leave_type,
		leaves_allowed: req.body.leave_qouta
	}
	//insert qouta against leave type
	LeaveQouta.create(params).then(result => {
		result ? res.redirect('/leave_prefernces') : res.redirect('/leave_prefernce/add')
	}).catch(err => {
		console.log('err in postAddPrefrence', err)
	})
}