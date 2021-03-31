

module.exports = (sequelize, Sequelize) =>{
	const LeaveRequestStatus = sequelize.define('leave_request_status', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		status: {
			type: Sequelize.STRING,
			allowNull: false,
			required: true
		}
	})
	return LeaveRequestStatus
}