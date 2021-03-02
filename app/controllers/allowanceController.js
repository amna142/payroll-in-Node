const {
	param
} = require('../routes/adminRoutes');
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


exports.delete = (allowanceId) => {
	return Allowance.destroy({
		where: {
			id: allowanceId
		}
	}).then(result => {
		console.log('Allowance row is deleted', result)
		if (result) {
			return result
		}
	}).catch(err => {
		console.log('err', err)
	})
}


exports.edit = (params, id) => {
	console.log('params', params)
	console.log('id', parseInt(id))
	return Allowance.update(params, {
		where: {
			id: parseInt(id)
		}
	}).then(result => {
		if (result) {
			console.log('updated', result)
			return result
		} else {
			req.flash('error', 'Employee is Not Updated')
			console.log('not updated')
		}
	}).catch(err => {
		console.log('err in edit allowance', err)
	})
}