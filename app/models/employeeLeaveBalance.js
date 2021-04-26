module.exports = (sequelize, Sequelize) => {
	const EmployeeLeaveBalance = sequelize.define('employee_leave_balance', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			autoIncrement: true,
			primaryKey: true
		},
		total_leaves_allowed: {
			type: Sequelize.INTEGER,
			required: true,
			allowNull: false
		},
		remaining_leaves: {
			type: Sequelize.INTEGER,
			required: true,
			allowNull: false
		}
	});
	return EmployeeLeaveBalance
}