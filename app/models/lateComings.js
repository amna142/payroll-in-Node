module.exports = (sequelize, Sequelize) => {
	const LateComing = sequelize.define('late_comings', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		machine_attendance_id: {
			type: Sequelize.STRING,
			allowNull: true,
			required: true
		},
		total_late_comings: {
			type: Sequelize.INTEGER,
			required: true,
			allowNull: false,
			default: 0
		},
		deducted_leaves: {
			type: Sequelize.INTEGER,
			required: true,
			allowNull: false,
			default: 0

		}
	});
	return LateComing
}