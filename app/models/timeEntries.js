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
			type: Sequelize.TIME,
			allowNull: false,
			required: false
		},
		check_out: {
			type: Sequelize.TIME,
			allowNull: false,
			required: false
		}
	});
	return TimeEntries
}