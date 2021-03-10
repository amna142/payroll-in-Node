const db = require("../util/database")
const Salaries = db.salaries
const GradeController = require('../controllers/gradeController')
const EmpAllowanceController = require('../controllers/empAllowancesController')
const EmpFundController = require('../controllers/empFundsController')
exports.createSalary = (empId, salaryAmount, gradeId) => {
	return Salaries.create({
		employeeId: empId,
		amount: salaryAmount
	}).then(result => {
		let salaryResult = result.dataValues
		//create employee aloowances and employee funds
		//find aloowanves and funds of particular grade of an employee
		GradeController.findById(gradeId).then(grades => {
			let tempAllowances = grades.allowances
			if (tempAllowances.length > 0) {
				employeeAllowances(tempAllowances, parseInt(salaryResult.id))
			}
			let tempFunds = grades.funds
			if (tempFunds.length > 0) {
				employeeFunds(tempFunds, parseInt(salaryResult.id))
			}
		}).catch(err => {
			console.log('err in createSalary', err)
		})
	}).catch(err => {
		console.log('err', err)
	})
}

function employeeFunds(funds, id) {
	let fundsArray = []
	funds.forEach(fund => {
		fundsArray.push({
			name: fund.dataValues.name,
			description: fund.dataValues.description,
			amount: fund.dataValues.amount,
			salaryId: id
		})
	});
	console.log('funds', funds)
	if (funds.length > 0) {
		//createBulk employee allowances at once
		EmpFundController.createEmpFunds(fundsArray).then(result => {
			console.log('created employee funds', result)
		}).catch(err => {
			console.log('erre', err)
		})
	}
}

function employeeAllowances(allowances, id) {
	let allowancesArray = []
	allowances.forEach(allowance => {
		allowancesArray.push({
			name: allowance.dataValues.name,
			description: allowance.dataValues.description,
			amount: allowance.dataValues.amount,
			salaryId: id
		})
	});
	console.log('allowancesArray', allowancesArray)
	if (allowancesArray.length > 0) {
		//createBulk employee allowances at once
		EmpAllowanceController.createEmpAllowances(allowancesArray).then(result => {
			console.log('created employee alloeances', result)
		}).catch(err => {
			console.log('erre', err)
		})
	}
}