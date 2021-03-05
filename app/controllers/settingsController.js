const db = require('../util/database')
const ENUM = require('../util/constants')
const AllowanceController = require('./allowanceController')
const TOAST = require('../util/toast')
const GradeController = require('./gradeController')
const LogsController = require('../controllers/logsController')
var AUDIT_LOGS = []
var old_allowance_value = {}
const {
	Op
} = require("sequelize");


exports.getPage = async (req, res, next) => {
	let path = req.path;
	let pathArray = path.split('/')
	let allowances = []
	if (pathArray.includes('grades')) {
		//get allowancesto show in dropdown
		allowances = await AllowanceController.findAll()
	}
	path = path.replace(path[0], '')
	res.render(path, {
		allowances: allowances
	})
}


//get Allowances

exports.getSettings = async (req, res) => {
	let allowances = await AllowanceController.findAll()
	let grades = await GradeController.findAll()
	let user = req.session.user;

	let logsArray = []
	let isEmployee = false
	if (user.roleId === null) {
		logsArray = await LogsController.employeeLogs(req.session.user.id)
		isEmployee = true
	} else {
		logsArray = await LogsController.getLogs({
			emp_id: user.id,
			record_type: 'Allowance'
		})
		isEmployee = false
	}
	res.render('settings', {
		allowances: allowances,
		grades: grades,
		logsData: logsArray
	})
}

//create Allowances

exports.postAddAllowances = async (req, res) => {
	console.log('req.body', req.body)
	let params = {
		name: req.body.allowance_name,
		description: req.body.allowance_description,
		amount: req.body.allowance_amount
	}
	if (Object.keys(params).length > 0) {
		Object.keys(params).forEach(function (key) {
			var value = params[key]
			console.log(key, value)
			AUDIT_LOGS.push({
				name: req.session.user.name,
				emp_id: req.session.user.id,
				date: LogsController.convertDate(new Date()),
				time: LogsController.getTime(),
				action: ENUM.SET,
				record_type: 'Allowance',
				field_id: key,
				new_value: value
			})
		})
	}
	let allowance_found = await AllowanceController.findByName(params.name)
	if (!allowance_found) {
		let allowance = await AllowanceController.create(params)
		old_allowance_value = params
		if (allowance) {
			LogsController.insertLogs(AUDIT_LOGS)
			res.redirect('/settings#allowances')
		}
	} else {
		console.log('duplicate allowance isnt allowed')
		res.redirect('/settings/allowances/add')
	}
}

exports.postAddGrade = async (req, res) => {
	let temp = []
	let params = {
		grade: req.body.grade_short_form,
		min_salary: req.body.min_salary,
		max_salary: req.body.max_salary
	}
	let selectedAllowances = req.body.selected_allowances
	//check if grade of same name esits
	let grade_exist = await GradeController.findByName(params.grade)
	if (!grade_exist) {
		let grade = await GradeController.create(params)
		console.log(">> Created grade: " + JSON.stringify(grade, null, 2))
		if (Object.keys(params).length > 0) {
			Object.keys(params).forEach(function (key) {
				var value = params[key]
				console.log(key, value)
				AUDIT_LOGS.push({
					name: req.session.user.name,
					emp_id: req.session.user.id,
					date: LogsController.convertDate(new Date()),
					time: LogsController.getTime(),
					action: ENUM.SET,
					record_type: 'Grade',
					field_id: key,
					new_value: value
				})
			})
		}
		if (!Array.isArray(selectedAllowances)) {
			temp.push(selectedAllowances)
		} else {
			temp = selectedAllowances
		}
		if (grade) {
			GradeController.addAllowances(grade.id, temp)
			LogsController.insertLogs(AUDIT_LOGS)
			res.redirect('/settings#grades')
		}
	} else {
		console.log('grade already exist')
		res.redirect('/settings#grades')
	}
}


exports.deleteGrade = async (req, res) => {
	let gradeId = req.params.id
	//call destroy function from database
	let grade_destroyed = await GradeController.delete(gradeId)
	if (grade_destroyed) {
		AUDIT_LOGS.push({
			name: req.session.user.name,
			emp_id: req.session.user.id,
			date: LogsController.convertDate(new Date()),
			time: LogsController.getTime(),
			action: ENUM.DELETE,
			record_type: 'Grade'
		})
		LogsController.insertLogs(AUDIT_LOGS)
		res.redirect('/settings#grades')
	}
}


exports.deleteAllowance = async (req, res) => {
	let allowanceId = req.params.id
	//call destroy function from database
	let allowance_destroyed = await AllowanceController.delete(allowanceId)
	if (allowance_destroyed) {
		AUDIT_LOGS.push({
			name: req.session.user.name,
			emp_id: req.session.user.id,
			date: LogsController.convertDate(new Date()),
			time: LogsController.getTime(),
			action: ENUM.DELETE,
			record_type: 'Allowance'
		})
		LogsController.insertLogs(AUDIT_LOGS)
		res.redirect('/settings#allowances')
	}
}

exports.editAllowance = async (req, res, next) => {
	let id = req.body.allowance_id
	let params = {
		name: req.body.allowance_name,
		description: req.body.allowance_description,
		amount: req.body.allowance_amount
	}
	// check if an allowance of same name exist
	// findByName
	let allowance_exist = await AllowanceController.findByName(params.name)
	if (!allowance_exist) {
		let updated_allowance = await AllowanceController.edit(params, id)
		updated_allowance ? res.redirect('/settings#allowances') : null
	} else {
		console.log('already exist with the same name')
		res.redirect('/settings#allowances')
	}
}

exports.editGrade = async (req, res, next) => {
	let old_record = req.body.oldRecord
	let selected_allowances = []
	if (Array.isArray(req.body.selected_allowances)) {
		selected_allowances = req.body.selected_allowances
	} else {
		selected_allowances.push(req.body.selected_allowances)
	}
	let new_record = {
		id: parseInt(req.body.grade_id),
		grade: req.body.grade_short_form,
		min_salary: parseInt(req.body.min_salary),
		max_salary: parseInt(req.body.max_salary),
		allowances: selected_allowances
	}
	let updated_values = shallowEqual(JSON.parse(old_record), new_record)

	//here adds updated logs
	// addUpdatedLogs(updated_values, old_record)

	//see if grade of the given id exist 
	let grade_exist = await GradeController.findById(parseInt(req.body.grade_id))
	if (grade_exist) {
		selected_allowances = updated_values.allowances
		delete updated_values['allowances']
		//now update grade values
		await GradeController.update(updated_values, parseInt(req.body.grade_id))
		if (selected_allowances.length > 0) {
			GradeController.updateAllowances(parseInt(req.body.grade_id), selected_allowances)
		} else {
			console.log('No allowance has been updated')
		}
		res.redirect('/settings#grades')
	} else {
		console.log('grade doesnt exist')
	}
}


function addUpdatedLogs(updated_values, old_record) {
	if (Object.keys(updated_values).length === 0) {
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
	} else {
		Object.keys(updated_values).forEach(function (key) {
			var value = updated_values[key]
			AUDIT_LOGS.push({
				name: req.session.user.name,
				emp_id: req.session.user.id,
				date: LogsController.convertDate(new Date()),
				time: LogsController.getTime(),
				action: ENUM.UPDATE,
				record_type: 'Grades',
				field_id: key,
				old_value: oldRecord[key],
				new_value: value
			})
		})
	}
}

function shallowEqual(oldRecord, newRecord) {
	var obj = {}
	delete oldRecord['updatedAt']
	delete oldRecord['createdAt']
	let allowance_ids = []
	//make allowance id array only 
	oldRecord.allowances.forEach(allowance => {
		allowance_ids.push(allowance.id)
	});
	oldRecord.allowances = allowance_ids
	const oldRecordKeys = Object.keys(oldRecord);
	const oldRecordValues = Object.values(oldRecord)
	const newRecordKeys = Object.keys(newRecord);
	const newRecordValues = Object.values(newRecord)
	const newRecordAllowances = Object.values(newRecord.allowances)
	const oldRecordAllowances = Object.values(oldRecord.allowances)
	key_value = ''
	if (oldRecordKeys.length !== newRecordKeys.length) {
		return false;
	}
	let updated_allowances = shallowEqualAllowances(oldRecordAllowances, newRecordAllowances)
	for (var i = 0; i < oldRecordValues.length; i++) {
		if (newRecordValues[i] !== undefined) {
			if (oldRecordValues[i] !== newRecordValues[i]) {
				key_value = newRecordKeys[i];
				obj[key_value] = newRecordValues[i]
			}
		}
	}
	obj.allowances = updated_allowances
	console.log('updatedFields', obj)
	return obj
}

function shallowEqualAllowances(oldAllowances, newAllowances) {
	let updated_allowance = []
	for (let i = 0; i < oldAllowances.length; i++) {
		if (oldAllowances[i] !== undefined && newAllowances[i] !== undefined) {
			if (parseInt(oldAllowances[i]) !== parseInt(newAllowances[i])) {
				updated_allowance.push(parseInt(oldAllowances[i]))
			}
		}
	}
	return updated_allowance;
}