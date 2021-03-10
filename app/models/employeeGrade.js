module.exports = (sequelize, Sequelize) => {
	const EmployeeGrade = sequelize.define('employee_grade', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		grade: {
			type: Sequelize.STRING,
			notEmpty: true,
			allowNull: false,
			required: true
		},
		min_salary: {
			type: Sequelize.INTEGER,
			notEmpty: true,
			required: true,
			allowNull: false
		},
		max_salary: {
			type: Sequelize.INTEGER,
			notEmpty: true,
			required: true,
			allowNull: false
		},
		isInactive: {
			type: Sequelize.BOOLEAN,
			notEmpty: true,
			defaultValue: false,
			allowNull: false,
			required: true
		}

	});
	return EmployeeGrade
}