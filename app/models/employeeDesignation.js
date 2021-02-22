

module.exports = (sequelize, Sequelize) =>{
	const EmployeeDesignation = sequelize.define('employee_designation', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		designation_type: {
			type: Sequelize.STRING,
			notEmpty: true,
			allowNull: false,
			required: true
		}
	});
	return EmployeeDesignation
}