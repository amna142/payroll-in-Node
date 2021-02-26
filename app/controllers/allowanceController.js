const db = require('../util/database')
const Grade = db.employee_grade
const Allowance = db.allowances

exports.create = (params) => {
	return Allowance.create(params)
		.then((allowance) => {
			console.log(">> Created allowance: " + JSON.stringify(allowance, null, 4));
			return allowance.dataValues;
		})
		.catch((err) => {
			console.log(">> Error while creating allowance: ", err);
		});
};


//Retrieve all Allowances

exports.findAll = () => {
	let arr = []
	return Allowance.findAll()
		.then((allowances) => {
			if (allowances.length > 0) {
				allowances.forEach(element => {
					arr.push(element.dataValues)
				});
			}
			return arr;
		})
		.catch((err) => {
			console.log(">> Error while retrieving allowance: ", err);
		});
};


//Get the allowance for a given allowance id

exports.findById = (id) => {
	return Allowance.findByPk(id, {
			include: [{
				model: Grade
			}, ],
		})
		.then((allowance) => {
			return allowance;
		})
		.catch((err) => {
			console.log(">> Error while finding allowances: ", err);
		});
};