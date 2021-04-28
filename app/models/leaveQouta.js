

module.exports = (sequelize, Sequelize) =>{
	const LeaveQouta = sequelize.define('leave_qouta', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		leaves_allowed: {
			type: Sequelize.INTEGER,
			allowNull: false,
			required: true,
			defaultValue: 0
		},
	})
	return LeaveQouta
}