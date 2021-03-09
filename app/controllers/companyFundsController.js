



const db = require('../util/database')
const Grade = db.employee_grade
const Fund = db.company_funds

exports.create = (params) => {
	return Fund.create(params)
		.then((fund) => {
			console.log(">> Created fund: " + JSON.stringify(fund, null, 4));
			return fund.dataValues;
		})
		.catch((err) => {
			console.log(">> Error while creating fund: ", err);
		});
};


//Retrieve all Allowances

exports.findAll = () => {
	let arr = []
	return Fund.findAll()
		.then((funds) => {
			if (funds.length > 0) {
				funds.forEach(element => {
					arr.push(element.dataValues)
				});
			}
			return arr;
		})
		.catch((err) => {
			console.log(">> Error while retrieving allowance: ", err);
		});
};


exports.findByName = (name) => {
	return Fund.findOne({
			where: {
				name: name
			},
			include: [{
				model: Grade,
				as: 'grades'
			}, ],
		})
		.then((fund) => {
			if(fund){
				return fund.dataValues
			}else {
				console.log('no fund found')
			}
			return fund;
		})
		.catch((err) => {
			console.log(">> Error while finding fund: ", err);
		});
}

//Get the allowance for a given allowance id

exports.findById = (id) => {
	return Fund.findByPk(id, {
			include: [{
				model: Grade,
				as: 'grades'
			}, ],
		})
		.then((fund) => {
			return fund.dataValues;
		})
		.catch((err) => {
			console.log(">> Error while finding fund: ", err);
		});
};


exports.delete = (fundId) => {
	return Fund.destroy({
		where: {
			id: fundId
		}
	}).then(result => {
		console.log('Fund row is deleted', result)
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
	return Fund.update(params, {
		where: {
			id: parseInt(id)
		}
	}).then(result => {
		if (result) {
			console.log('updated', result)
			return result
		} else {
			console.log('not updated')
		}
	}).catch(err => {
		console.log('err in edit allowance', err)
	})
}