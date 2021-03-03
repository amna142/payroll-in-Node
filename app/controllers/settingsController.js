const CRUD = require('../util/crud')
const db = require('../util/database')
const AllowanceController = require('./allowanceController')
const GradeController = require('./gradeController')
const LogsController = require('../controllers/logsController')
var AUDIT_LOGS = []
exports.getAllGrades = (req, res) => {
	CRUD.findAll(db.employee_grade, db.allowances).then(result => {
		console.log('results', result)
	}).catch(err => {
		console.log('err in getAllGrades', err)
	})
}


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
	res.render('settings', {
		allowances: allowances,
		grades: grades
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
	let allowance_found = await AllowanceController.findByName(params.name)
	console.log('allowance_found', allowance_found)
	if (!allowance_found) {
		let allowance = await AllowanceController.create(params)
		if (allowance) {
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
	let junctionTable
	let params = {
		grade: req.body.grade_short_form,
		min_salary: req.body.min_salary,
		max_salary: req.body.max_salary
	}
	let selectedAllowances = req.body.selected_allowances
	let grade = await GradeController.create(params)
	console.log(">> Created grade: " + JSON.stringify(grade, null, 2))
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
		grade.id ? res.redirect('/settings') : null
	}
}


exports.deleteGrade = async (req, res) => {
	let gradeId = req.params.id
	console.log('gradeId', gradeId)
	//call destroy function from database
	let grade_destroyed = await GradeController.delete(gradeId)
	console.log('grade_destroyed', grade_destroyed)
	if (grade_destroyed) {
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
		res.redirect('/settings#allowances')
	}
}

exports.editAllowance = async (req, res, next) => {
	console.log('req 123', req.body)
	let id = req.body.allowance_id
	let params = {
		name: req.body.allowance_name,
		description: req.body.allowance_description,
		amount: req.body.allowance_amount
	}
	let updated_allowance = await AllowanceController.edit(params, id)
	console.log('updated_allowance', updated_allowance)
	updated_allowance ? res.redirect('/settings#allowances') : null
}