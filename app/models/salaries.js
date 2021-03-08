module.exports = (sequelize, Sequelize) => {
	const Salaries = sequelize.define('salaries', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		amount: {
			type: Sequelize.INTEGER,
			notEmpty: true,
			required: true,
			allowNull: false
		},
	});
	return Salaries
}