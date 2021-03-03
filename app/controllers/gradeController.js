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
			model: Allowance,
			as: 'allowances',
			attributes: ['id', 'name', 'description', 'amount'],
			through: {
				attributes: []
			}
		}]
	}).then(results => {
		// console.log(">> Created grade: " + JSON.stringify(results, null, 2))
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
				console.log('grade', grade)
				return grade;
			});
		})
		.catch((err) => {
			console.log(">> Error while adding alloeances to grade: ", err);
		});
};


exports.delete = (gradeId) => {
	return Grade.destroy({
		where: {
			id: gradeId
		}
	}).then(result => {
		console.log('grade row is deleted', result)
		if (result) {
			return result
		}
	}).catch(err => {
		console.log('err', err)
	})
}


exports.findByName = (name) => {
	return Grade.findOne({
			where: {
				grade: name
			},
			include: [{
				model: Allowance,
				as: 'allowances'
			}, ],
		})
		.then((grade) => {
			if (grade) {
				return grade.dataValues
			} else {
				console.log('no grade found')
			}
		})
		.catch((err) => {
			console.log(">> Error while finding grades: ", err);
		});
}