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
	console.log('grades', grades)
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
	let allowance = await AllowanceController.create(params)
	if (allowance) {
		console.log('allowance.id', allowance.id)
		allowance_id = allowance.id
		allowance.id ? res.redirect('/settings') : null
	}
}

exports.postAddGrade = async (req, res) => {
	var junctionTable
	let params = {
		grade: req.body.grade_short_form,
		min_salary: req.body.min_salary,
		max_salary: req.body.max_salary
	}
	let selectedAllowances = req.body.selected_allowances
	let grade = await GradeController.create(params)
	console.log(">> Created grade: " + JSON.stringify(grade, null, 2))
	if (grade) {
		selectedAllowances.forEach(allowance_id => {
			console.log('gradeId', grade.id)
			junctionTable = GradeController.addAllowances(grade.id, allowance_id).then(result => {
				console.log('addes allowance in grade table', grade.id + allowance_id )
				console.log('resultssssss', result)
			}).catch(err => {
				console.log('err', err)
			})
		});
		grade.id ? res.redirect('/settings') : null
	}

}


exports.deleteGrade = async (req, res) =>{
	let gradeId = req.params.id
	console.log('gradeId', gradeId)
	//call destroy function from database
	let grade_destroyed = await GradeController.delete(gradeId)
	console.log('grade_destroyed', grade_destroyed)
	if(grade_destroyed){
		res.redirect('/settings')
	}
	
}