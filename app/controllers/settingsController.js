
const CRUD = require('../util/crud')
const db = require('../util/database')
const AllowanceController = require('./allowanceController')
const GradeController = require('./gradeController')

var allowance_id;


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
	if (pathArray.includes('grades')) {
		//get allowancesto show in dropdown
		let allowances = await AllowanceController.findAll()
		console.log('allowances', allowances)
	}
	path = path.replace(path[0], '')
	console.log('path', path)
	res.render(path)
}

//create Allowances

exports.postAddAllowances = async (req, res) => {
	console.log('req.body', req.body)
	let params = {
		name: req.body.allowance_name,
		description: req.body.allowance_description,
		amount: req.body.allowance_amount
	}
	let allowance = await AllowanceController.create(params)
	if (allowance) {
		console.log('allowance.id', allowance.id)
		allowance_id = allowance.id
		allowance.id ? res.redirect('/settings') : null
	}
}

exports.postAddGrade = async (req, res) => {
	console.log('req.boy', req.body)
	let params = {
		grade: req.body.grade_short_form,
		min_salary: req.body.min_salary,
		max_salary: req.body.max_salary
	}
	//create grade in Database
	let grade = await GradeController.create(params)
	if (grade) {
		console.log('allowance_id', allowance_id)
		let juntionTable = await GradeController.addAllowances(grade.id, allowance_id);
		console.log('juntionTable', juntionTable)
		grade.id ? res.redirect('/settings') : null
	}

}