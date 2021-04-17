module.exports = (sequelize, Sequelize) => {
	const CompanyPreferences = sequelize.define('company_preferences', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		start_time: {
			type: Sequelize.STRING,
			allowNull: true,
			required: false
		},
		off_time: {
			type: Sequelize.STRING,
			allowNull: true,
			required: false
		},
		working_hours: {
			type: Sequelize.FLOAT,
			allowNull: true,
			required: false
		},
		working_days: {
			type: Sequelize.INTEGER,
			allowNull: true,
			required: false
		},
		over_time: {
			type: Sequelize.FLOAT,
			allowNull: true,
			required: false
		},
		total_annual_leaves: {
			type: Sequelize.INTEGER,
			allowNull: true, 
			required: false
		}
	});
	return CompanyPreferences
}