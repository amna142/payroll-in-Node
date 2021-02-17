module.exports = (sequelize, Sequelize) => {
	const Role = sequelize.define('role', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			autoIncrement: true,
			primaryKey: true
		},
		title: {
			type: Sequelize.STRING,
			allowNull: false
		}
	});
	return Role
}