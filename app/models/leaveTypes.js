module.exports = (sequelize, Sequelize) => {
	const LeaveTypes = sequelize.define('leave_types', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		name: {
			type: Sequelize.STRING,
			allowNull: false,
			required: true
		},
		description: {
			type: Sequelize.STRING,
			allowNull: true,
			required: false
		},
	})
	return LeaveTypes;
}