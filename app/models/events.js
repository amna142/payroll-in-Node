module.exports = (sequelize, Sequelize) => {
	const Events = sequelize.define('events', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		name: {
			type: Sequelize.STRING,
			required: true,
			allowNull: false
		},
		from_date: {
			type: Sequelize.STRING,
			required: true,
			allowNull: false
		},
		to_date: {
			type: Sequelize.STRING,
			allowNull: false,
			required: true
		}
	});
	return Events
}