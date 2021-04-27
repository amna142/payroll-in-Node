const EmployeeController = require('./employeeController')
const ENUM = require('../util/constants')
const db = require('../util/database')
const LeaveQouta = db.leave_qouta
const CompanyPreferences = db.company_preferences
const LeaveTypes = db.leave_types
exports.getLeaves = async (req, res, next) => {
	let user = EmployeeController.isEmployee(req)
	let preferences = await leave_prefernces()
	console.log('preferences', JSON.stringify(preferences))
	let designation = await EmployeeController.CurrentUserDesignation(req.session.user.employeeDesignationId)
	console.log('designation', designation.dataValues.designation_type)
	res.render('leavePrefernces/index', {
		name: req.session.user.name,
		isEmployee: user.isEmployee,
		preferences: preferences,
		designation: designation.dataValues.designation_type,
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
		console.log('result', result)
		result ? res.redirect('/leave_preferences') : res.redirect('/leave_prefernce/add')
	}).catch(err => {
		console.log('err in postAddPrefrence', err)
	})
}

exports.getCompanyPreferences = async (req, res) => {
	//fetch data from company preferences
	let user = EmployeeController.isEmployee(req)
	let company_preferences = await this.fetchDataFromCompanyPreferences()
	console.log('company_preferences', company_preferences)
	res.render('company-preferences', {
		name: req.session.user.name,
		company_preferences: company_preferences,
		isEmployee: user.isEmployee,
		navigation: {
			role: user.role,
			pageName: ENUM.leave_prefernces
		}
	})
}

exports.fetchDataFromCompanyPreferences = () => {
	return CompanyPreferences.findOne({
		attributes: ['id', 'start_time', 'off_time', 'working_hours', 'working_days', 'over_time'],
		raw: true
	}).then(result => {
		return result;
	}).catch(err => {
		console.log('err in fetchDataFromCompanyPreferences', err)
	})
}


exports.postCompanyPreferences = (req, res) => {
	let obj = req.body;
	let temp = []
	let id = obj.company_preference_id
	delete obj['company_preference_id']
	let keys = Object.keys(obj)
	keys.map((key) => {
		if (obj[key]) {
			temp[key] = obj[key].replace(/^\s+|\s+$/g, '')
		}
	})
	//now update these values in company Preferences table
	let updateStatus = updatePreferences(temp, parseInt(id));
	if (updateStatus) {
		res.redirect('/company_preferences')
	}
}
let updatePreferences = (values_to_update, id) => {
	return CompanyPreferences.update(values_to_update, {
		where: {
			id: id
		}
	}).then(result => {
		console.log('result in updatePreferences', result)
		return result
	}).catch(err => {
		console.log('err in updatePreferences', err)
	})
}