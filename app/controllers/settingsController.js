const ENUM = require('../util/constants')
const AllowanceController = require('./allowanceController')
const GradeController = require('./gradeController')
const EmployeeController = require('./employeeController')
const nodeParser = require('node-date-parser')
const LogsController = require('../controllers/logsController')
const FundController = require('../controllers/companyFundsController')
const constants = require('../util/constants')
const nodeDateParser = require('node-date-parser')
var AUDIT_LOGS = []

var errorMessages = [];

exports.getPage = async (req, res, next) => {
	let path = req.path;
	let pathArray = path.split('/')
	let allowances = [],
		logsArray = []
	let user = EmployeeController.isEmployee(req)
	let funds = []
	if (pathArray.includes('grades')) {
		//get allowancesto show in dropdown
		allowances = await AllowanceController.findAll()
		funds = await FundController.findAll()
	}
	path = path.replace(path[0], '')
	if (req.flash('error').length > 0) {
		errorMessages.push(req.flash('error'))
	}
	var designation = await EmployeeController.CurrentUserDesignation(req.session.user.employeeDesignationId)
	if (user.role === 'Employee' && designation.designation_type !== 'HR') {
		logsArray = await LogsController.employeeLogs(req.session.user.id)
	} else {
		logsArray = await LogsController.getLogs({
			emp_id: req.session.user.id,
			record_type: 'Funds'
		})
	}
	res.render(path, {
		allowances: allowances,
		name: req.session.user.name,
		errorMessage: errorMessages.length > 0 ? errorMessages[0] : null,
		logsData: logsArray,
		navigation: {
			role: user.role,
			pageName: constants.setting
		},
		funds: funds
	})
	errorMessages = []
}


//get Allowances

exports.getSettings = async (req, res) => {
	var designation = await EmployeeController.CurrentUserDesignation(req.session.user.employeeDesignationId)
	console.log('designation type', designation.designation_type)
	let allowances = await AllowanceController.findAll()
	let grades = await GradeController.findAll()
	let funds = await FundController.findAll()
	// let user = req.session.user;
	let logsArray = []
	let user = EmployeeController.isEmployee(req)
	console.log('user amna', user)
	if (user.role === 'Employee' && designation.designation_type !== 'HR') {
		logsArray = await LogsController.employeeLogs(req.session.user.id)
	} else {
		logsArray = await LogsController.getLogs({
			emp_id: req.session.user.id
		})
	}
	res.render('settings', {
		allowances: allowances,
		grades: grades,
		navigation: {
			role: user.role,
			pageName: constants.setting
		},
		funds: funds,
		designation: designation.designation_type,
		name: req.session.user.name,
		logsData: logsArray,
		errorMessage: req.flash('error').length > 0 ? req.flash('error')[0] : null,
	})
	AUDIT_LOGS = []
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
				date: new Date(),
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
			console.log(JSON.stringify(AUDIT_LOGS))
			LogsController.insertLogs(AUDIT_LOGS)
			res.redirect('/settings#allowances')
		}
	} else {
		console.log('duplicate allowance isnt allowed')
		req.flash('error', 'Duplicate Allowance isnt Allowed')
		errorMessages.push(req.flash('error')[0])
		res.redirect('/settings/allowances/add')
	}
}

exports.postAddGrade = async (req, res) => {
	console.log('req.body in postAddGrade', req.body)
	let temp = [],
		temp2 = []
	let params = {
		grade: req.body.grade_short_form,
		min_salary: parseInt(req.body.min_salary),
		max_salary: parseInt(req.body.max_salary)
	}
	let selectedFunds = req.body.selected_funds
	let selectedAllowances = req.body.selected_allowances

	if (params.min_salary >= params.max_salary) {
		req.flash('error', 'Maximum Salary must be greater than Minimum Salary')
	}

	//check if grade of same name exists
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
					date: nodeParser.parse(new Date()),
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
		(!Array.isArray(selectedFunds)) ? temp2.push(selectedFunds): temp2 = selectedFunds
		if (grade) {
			GradeController.addAllowances(grade.id, temp)
			GradeController.addFunds(grade.id, temp2)
			LogsController.insertLogs(AUDIT_LOGS)
			res.redirect('/settings#grades')
		}
	} else {
		console.log('grade already exist')
		req.flash('error', 'Grade with same name already Exist. Please try with unique name')
		errorMessages.push(req.flash('error')[0])
		res.redirect('/settings/grades/add')
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
			date: nodeParser.parse(new Date()),
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
			date: new Date(),
			time: LogsController.getTime(),
			action: ENUM.DELETE,
			record_type: 'Allowance'
		})
		console.log('AUDIT_LOGS', AUDIT_LOGS)
		LogsController.insertLogs(AUDIT_LOGS)
		res.redirect('/settings#allowances')
	}
}

exports.editAllowance = async (req, res, next) => {
	console.log('req.body', req.body)
	let allowance_update;
	const id = parseInt(req.body.allowance_id)
	const newRecord = {
		id: id,
		name: req.body.allowance_name,
		description: req.body.allowance_description,
		amount: parseInt(req.body.allowance_amount)
	}
	const oldRecord = JSON.parse(req.body.edit_old_allowance_record)
	let updated_allowance_fields = FieldsDifference(oldRecord, newRecord)

	//find by allowance name
	let allowance_exist = await AllowanceController.findByName(newRecord.name)
	if (Object.keys(updated_allowance_fields).length > 0) {

		Object.keys(updated_allowance_fields).forEach(function (key) {
			var value = updated_allowance_fields[key]
			console.log(key, value)
			AUDIT_LOGS.push({
				name: req.session.user.name,
				emp_id: req.session.user.id,
				date: new Date(),
				time: LogsController.getTime(),
				action: ENUM.UPDATE,
				record_type: 'Allowance',
				field_id: key,
				old_value: oldRecord[key],
				new_value: value
			})
		})

		if (allowance_exist) {
			if (allowance_exist.id === newRecord.id) {

				//update allowance record in database
				allowance_update = await AllowanceController.edit(updated_allowance_fields, id)
				if (allowance_update) {
					LogsController.insertLogs(AUDIT_LOGS)
					res.redirect('/settings#allowances')
				}
			} else {
				req.flash('error', 'allowance with the same name exist')
				console.log('allowance with the same name exist')
				res.redirect('/settings#allowances')
			}
		} else {
			allowance_update = await AllowanceController.edit(updated_allowance_fields, id)
			if (allowance_update) {
				this.getSettings(req, res)
			}
		}
	} else {
		req.flash('error', 'nothing has been changed. please change any field')
		console.log('nothing has been changed. please change any field')
		this.getSettings(req, res)
	}
}

exports.editGrade = async (req, res, next) => {
	console.log('req.body mna', req.body)
	let old_record = req.body.oldRecord
	let selected_allowances = [],
		selected_funds = []
	if (Array.isArray(req.body.selected_allowances)) {
		selected_allowances = req.body.selected_allowances
	} else {
		selected_allowances.push(req.body.selected_allowances)
	}
	(Array.isArray(req.body.selected_funds)) ? selected_funds = req.body.selected_funds: selected_funds.push(req.body.selected_funds)
	let new_record = {
		id: parseInt(req.body.grade_id),
		grade: req.body.grade_short_form,
		isInactive: req.body.isInactive,
		min_salary: parseInt(req.body.min_salary),
		max_salary: parseInt(req.body.max_salary),
		allowances: selected_allowances,
		funds: selected_funds
	}
	let updated_values = await shallowEqual(JSON.parse(old_record), new_record)
	console.log('updated_values', updated_values)
	console.log('old_record', old_record)
	//see if grade of the given id exist 
	let grade_exist = await GradeController.findById(parseInt(req.body.grade_id))
	if (grade_exist) {

		Object.keys(updated_values).forEach(function (key) {
			var value = updated_values[key]
			console.log('old_record[key]', old_record[key])
			console.log('key', key)
			AUDIT_LOGS.push({
				name: req.session.user.name,
				emp_id: req.session.user.id,
				date: new Date(),
				time: LogsController.getTime(),
				action: ENUM.UPDATE,
				record_type: 'Grades',
				field_id: key,
				old_value: old_record[key],
				new_value: value
			})
		})


		selected_allowances = updated_values.allowances
		selected_funds = updated_values.funds
		delete updated_values['allowances']
		delete updated_values['funds']
		//now update grade values
		await GradeController.update(updated_values, parseInt(req.body.grade_id))

		if (selected_allowances.length > 0) {
			console.log('going to update allowance junction table')
			GradeController.updateAllowances(parseInt(req.body.grade_id), selected_allowances)
		} else {
			req.flash('error', 'No allowance has been updated')
			console.log('No allowance has been updated')
		}
		if (selected_funds.length > 0 && selected_allowances !== undefined) {
			GradeController.updateFunds(parseInt(req.body.grade_id), selected_funds)
		} else {
			req.flash('error', 'No funds has been updated')
			console.log('No funds has been updated')
		}
		LogsController.insertLogs(AUDIT_LOGS)
		res.redirect('/settings#grades')
	} else {
		console.log('grade doesnt exist')
	}
}

exports.editFund = async (req, res) => {
	console.log('req.body', req.body)
	let id = req.body.fund_id_edit;
	let newRecord = {
		id: parseInt(id),
		name: req.body.fund_name_edit,
		description: req.body.fund_description_edit,
		amount: req.body.fund_amount_edit
	}
	let oldRecord = JSON.parse(req.body.oldRecord)
	console.log('oldRecord', oldRecord)
	console.log('newRecord', newRecord)
	let updated_fund_record = FieldsDifference(oldRecord, newRecord)
	console.log('updated_fund_record', updated_fund_record)
	//find by fund name
	let fund_update;
	let fund_exist = await FundController.findByName(newRecord.name)
	console.log('fund_exist', fund_exist)
	console.log('new_record', newRecord)
	if (Object.keys(updated_fund_record).length > 0) {
		Object.keys(updated_fund_record).forEach(function (key) {
			var value = updated_fund_record[key]
			console.log(key, value)
			AUDIT_LOGS.push({
				name: req.session.user.name,
				emp_id: req.session.user.id,
				date: new Date(),
				time: LogsController.getTime(),
				action: ENUM.UPDATE,
				record_type: 'Funds',
				field_id: key,
				old_value: oldRecord[key],
				new_value: value
			})
		})

		console.log('AUDIT_LOGS', JSON.stringify(AUDIT_LOGS))

		if (fund_exist) {
			if (fund_exist.id === newRecord.id) {
				//update allowance record in database
				fund_update = await FundController.edit(updated_fund_record, parseInt(id))
				if (fund_update) {
					LogsController.insertLogs(AUDIT_LOGS)
					res.redirect('/settings#funds')
				}
			} else {
				req.flash('error', 'Fund with the same name exist')
				console.log('fund with the same name exist')
				res.redirect('/settings#funds')
			}
		} else {
			fund_update = await FundController.edit(updated_fund_record, parseInt(id))
			if (fund_update) {
				this.getSettings(req, res)
			}
		}
	} else {
		req.flash('error', 'nothing has been changed. please change any field')
		console.log('nothing has been changed. please change any field')
		this.getSettings(req, res)
	}
}

exports.postFund = async (req, res, next) => {
	let params = {
		name: req.body.fund_name,
		description: req.body.fund_description,
		amount: req.body.fund_amount
	}
	if (Object.keys(params).length > 0) {
		Object.keys(params).forEach(function (key) {
			var value = params[key]
			console.log(key, value)
			AUDIT_LOGS.push({
				name: req.session.user.name,
				emp_id: req.session.user.id,
				date: new Date(),
				time: LogsController.getTime(),
				action: ENUM.SET,
				record_type: 'Funds',
				field_id: key,
				new_value: value
			})
		})
	}
	let fund_found = await FundController.findByName(params.name)
	if (!fund_found) {
		let fund = await FundController.create(params)
		old_fund_value = params
		if (fund) {
			LogsController.insertLogs(AUDIT_LOGS)
			res.redirect('/settings#funds')
		}
	} else {
		console.log('duplicate funds arent allowed')
		req.flash('error', 'Duplicate Fund isnt Allowed')
		errorMessages.push(req.flash('error')[0]);
		res.redirect('/settings/funds/add')
	}
}

exports.deleteFund = async (req, res) => {
	let fundId = req.params.id
	//call destroy function from database
	let fund_destroyed = await FundController.delete(fundId)
	if (fund_destroyed) {
		AUDIT_LOGS.push({
			name: req.session.user.name,
			emp_id: req.session.user.id,
			date: new Date(),
			time: LogsController.getTime(),
			action: ENUM.DELETE,
			record_type: 'Funds'
		})
		LogsController.insertLogs(AUDIT_LOGS)
		res.redirect('/settings#funds')
	}
}

function shallowEqual(oldRecord, newRecord) {
	console.log('inside shallowEqual')
	var obj = {}
	delete oldRecord['updatedAt']
	delete oldRecord['createdAt']
	let allowance_ids = [],
		funds_ids = []
	//make allowance id array only 
	oldRecord.allowances.forEach(allowance => {
		allowance_ids.push(allowance.id)
	});
	oldRecord.funds.forEach(fund => {
		funds_ids.push(fund.id)
	});
	oldRecord.allowances = allowance_ids
	oldRecord.funds = funds_ids
	const oldRecordKeys = Object.keys(oldRecord);
	const oldRecordValues = Object.values(oldRecord)
	const newRecordKeys = Object.keys(newRecord);
	const newRecordValues = Object.values(newRecord)
	console.log('oldRecord keys', oldRecordKeys)
	console.log('newRecord keys', newRecordKeys)
	key_value = ''
	if (oldRecordKeys.length !== newRecordKeys.length) {
		return false;
	}
	for (var i = 0; i < oldRecordValues.length; i++) {
		if (newRecordValues[i] !== undefined) {
			if (oldRecordValues[i] !== newRecordValues[i]) {
				key_value = newRecordKeys[i];
				obj[key_value] = newRecordValues[i]
			}
		}
	}
	console.log('obj', obj)
	return obj
}


function FieldsDifference(oldRecord, newRecord) {
	var obj = {}
	console.log('oldRecord', oldRecord)
	console.log('newRecord', newRecord)
	const oldRecordKeys = Object.keys(oldRecord);
	const oldRecordValues = Object.values(oldRecord)
	const newRecordKeys = Object.keys(newRecord);
	const newRecordValues = Object.values(newRecord)
	key_value = ''
	if (oldRecordKeys.length !== newRecordKeys.length) {
		return false;
	}
	for (var i = 0; i < oldRecordValues.length; i++) {
		if (newRecordValues[i] !== undefined) {
			if (oldRecordValues[i] !== newRecordValues[i]) {
				key_value = newRecordKeys[i];
				obj[key_value] = newRecordValues[i]
			}
		}
	}
	console.log('updatedFields', obj)
	return obj
}