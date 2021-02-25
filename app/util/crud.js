const db = require("./database")
const ALLOWANCES = db.allowances;
const GRADES = db.employee_grade

exports.findAll = (tableName, joinTable) => {
	let arr = []
	return tableName.findAll({
		include: [{
			model: joinTable
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
exports.findById = (id, tableName, joinTable) => {
	return tableName.findByPk(id, {
			include: [{
				model: joinTable,
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

exports.addAllowances = (gradeId, allowanceId, tableName, tableName2) => {
	return tableName.findByPk(gradeId)
		.then((grade) => {
			if (!grade) {
				console.log("grade not found!");
				return null;
			}
			return tableName2.findByPk(allowanceId).then((allowance) => {
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