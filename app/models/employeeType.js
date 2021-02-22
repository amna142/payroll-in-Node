

module.exports = (sequelize, Sequelize) =>{
	const EmployeeType = sequelize.define('employee_type', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		employee_type: {
			type: Sequelize.STRING,
			notEmpty: true,
			allowNull: false,
			required: true
		}
	});
	return EmployeeType
}