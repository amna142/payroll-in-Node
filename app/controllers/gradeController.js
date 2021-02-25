
const db = require('../util/database')
const Grade = db.employee_grade
const Allowance = db.allowances

exports.create = (params) => {
	console.log('params', params)
	return Grade.create(params)
		.then((grade) => {
			console.log(">> Created grade: " + JSON.stringify(grade, null, 2));
			return grade.dataValues;
		})
		.catch((err) => {
			console.log(">> Error while creating grade: ", err);
		});
};


exports.findAll = () => {
	let arr = []
	return Grade.findAll({
		include: [{
			model: Allowance
		}]
	}).then(results => {
		console.log('results', results)
		if (results.length > 0) {
			results.forEach(element => {
				arr.push(element.dataValues)
			});
		}
		return arr
	}).catch(err => {
		console.log('err in getAllRecord', err)
	})
}


//find Grade by id
exports.findById = (id) => {
	return Grade.findByPk(id, {
			include: [{
				model: Allowance,
			}, ],
		})
		.then((grade) => {
			return grade;
		})
		.catch((err) => {
			console.log(">> Error while finding Tag: ", err);
		});
};

//add allowances to grade

exports.addAllowances = (gradeId, allowanceId) => {
	console.log('gradeId', gradeId + allowanceId)
	return Grade.findByPk(gradeId)
		.then((grade) => {
			if (!grade) {
				console.log("grade not found!");
				return null;
			}
			return Allowance.findByPk(allowanceId).then((allowance) => {
				if (!allowance) {
					console.log("allowances not found!");
					return null;
				}
				grade.addAllowances(allowance);
				console.log(`>> added allowance id=${allowance.id} to grade id=${grade.id}`);
				return grade;
			});
		})
		.catch((err) => {
			console.log(">> Error while adding alloeances to grade: ", err);
		});
};