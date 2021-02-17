module.exports = (sequelize, Sequelize) => {
	const Employee = sequelize.define('employee', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			autoIncrement: true,
			primaryKey: true
		},
	
		name: {
			type: Sequelize.STRING,
			notEmpty: true
		},
		email: {
			notEmpty: true,
			type: Sequelize.STRING,
			allowNull: false,
			isEmail: true,
			required: true
		},
		password: {
			notEmpty: true,
			type: Sequelize.STRING,
			allowNull: false,
			required: true,
			len: [4, 8]
		},
		resetToken: {
			type: Sequelize.STRING
		},
		resetTokenExpiration: {
			type: Sequelize.DATE
		}
	});
	return Employee
}