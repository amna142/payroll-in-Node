const db = require("../util/database")



exports.getAllGrades = (req, res, next) => {
	let employee_grades = []
	return db.employee_grade.findAll().then(grades => {
		if (grades.length > 0) {
			grades.forEach(element => {
				employee_grades.push(element.dataValues)
			});
		}
		console.log('employee_grades', employee_grades)
		return employee_grades
	}).catch(err => {
		console.log('err in fetching grades', err)
	})
}

exports.findGradeById = (id) => {
	return db.employee_grade.findOne({
		where: {
			id: id
		}
	}).then(result => {
		return result.dataValues
	}).catch(err => {
		console.log('err', err)
	})
}