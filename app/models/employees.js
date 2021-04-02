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
			notEmpty: false
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
		dob: {
			notEmpty: true,
			type: Sequelize.DATE,
			allowNull: false,
			required: true
		},
		address: {
			type: Sequelize.STRING,
			allowNull: true,
			required: false,
			notEmpty: false
		},
		phone: {
			type: Sequelize.STRING,
			allowNull: true,
			required: false,
			notEmpty: false
		},
		starting_date: {
			type: Sequelize.DATE,
			allowNull: false,
			notEmpty: true,
			required: true
		},
		resume: {
			type: Sequelize.STRING,
			allowNull: false,
			required: true,
			notEmpty: false
		},
		isInactive: {
			type: Sequelize.BOOLEAN,
			required: true,
			allowNull: false,
			notEmpty: true,
			defaultValue: false
		},
		resetToken: {
			type: Sequelize.STRING
		},
		resetTokenExpiration: {
			type: Sequelize.DATE
		},
		attendMachineId: {
			type: Sequelize.STRING,
			required: true,
			allowNull: false
		},
		supervisor_email: {
			type: Sequelize.STRING,
			allowNull: true,
			required: true,
			isEmail: true,
			notEmpty: true
		}
	});
	return Employee
}