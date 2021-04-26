module.exports = (sequelize, Sequelize) => {
	const LateComing = sequelize.define('late_comings', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		date: {
			type: Sequelize.STRING,
			allowNull: false,
			required: true
		},
		machine_attendance_id: {
			type: Sequelize.STRING,
			allowNull: true,
			required: true
		},
		late_type: {
			type: Sequelize.STRING,
			required: true,
			allowNull: false
		}
	});
	return LateComing
}