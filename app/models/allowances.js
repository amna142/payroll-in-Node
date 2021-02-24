module.exports = (sequelize, Sequelize) => {
	const Allowances = sequelize.define('allowances', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		name: {
			type: Sequelize.STRING,
			allowNull: false,
			required: true
		},
		description: {
			type: Sequelize.STRING,
			allowNull: true,
			required: false
		},
		amount: {
			type: Sequelize.INTEGER,
			allowNull: false,
			required: true
		}

	});
	return Allowances
}