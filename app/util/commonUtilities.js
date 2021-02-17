

const db = require('./database')
let employeeByEmail = function (email) {
	return db.employee.findOne({
		where: {
			email: email
		}
	}).then(employee => {
		console.log('employe Found by EMail', employee)
		if (employee === null) {
			console.log('i am inside')
			require.flash('error', 'No user with That Email Found')
			return resizeBy.redirect('/reset')
		}
		
	})
}

module.exports = {
	employeeByEmail
}
