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
		console.log('allowances', allowances)
	}
	path = path.replace(path[0], '')
	console.log('path', path)
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
	console.log('allowance_found', allowance_found)
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
	console.log('i am clicked')
	let temp = []
	let params = {
		grade: req.body.grade_short_form,
		min_salary: req.body.min_salary,
		max_salary: req.body.max_salary
	}
	let selectedAllowances = req.body.selected_allowances
	//check if grade of same name esits
	let grade_exist = await GradeController.findByName(params.grade)
	console.log('grade_exist', grade_exist)
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
			temp.forEach(allowance_id => {
				junctionTable = GradeController.addAllowances(grade.id, allowance_id).then(result => {
					console.log('addes allowance in grade table', grade.id + allowance_id)
					console.log('resultssssss', result)
				}).catch(err => {
					console.log('err', err)
				})
			});
			if (grade.id) {
				LogsController.insertLogs(AUDIT_LOGS)
				res.redirect('/settings#grades')
			}
		}
	} else {
		console.log('grade already exist')
		res.redirect('/settings#grades')
	}
}


exports.deleteGrade = async (req, res) => {
	let gradeId = req.params.id
	console.log('gradeId', gradeId)
	//call destroy function from database
	let grade_destroyed = await GradeController.delete(gradeId)
	console.log('grade_destroyed', grade_destroyed)
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
	console.log('allowanceId', allowanceId)
	//call destroy function from database
	let allowance_destroyed = await AllowanceController.delete(allowanceId)
	console.log('allowance_destroyed', allowance_destroyed)
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
		console.log('updated_allowance', updated_allowance)
		updated_allowance ? res.redirect('/settings#allowances') : null
	} else {
		console.log('already exist with the same name')
		res.redirect('/settings#allowances')
	}
}

exports.editGrade = (req, res, next) => {
	console.log('req 123', req.body)
	let params = {
		grade: req.body.grade_short_form,
		min_salary: req.body.min_salary,
		max_salary: req.body.max_salary
	}
}
