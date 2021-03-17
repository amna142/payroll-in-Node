module.exports = (sequelize, Sequelize) => {
	const TimeEntries = sequelize.define('time_entries', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		check_in: {
			type: Sequelize.STRING,
			allowNull: false,
			required: false
		},
		check_out: {
			type: Sequelize.STRING,
			allowNull: false,
			required: false
		},
		work_time: {
			type: Sequelize.FLOAT,
			allowNull: false,
			require: true
		}
	});
	return TimeEntries
}