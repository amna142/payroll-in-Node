module.exports = (sequelize, Sequelize) => {
	const Attendance = sequelize.define('attendance', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		date: {
			type: Sequelize.DATE,
			allowNull: true,
			required: false
		},
		machine_attendance_id: {
			type: Sequelize.STRING,
			allowNull: false,
			required: false
		}
	});
	return Attendance
}