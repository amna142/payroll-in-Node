module.exports = (sequelize, Sequelize) => {
	const Leaves = sequelize.define('leaves', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		from_date: {
			type: Sequelize.DATE,
			allowNull: false,
			required: true
		},
		to_date: {
			type: Sequelize.DATE,
			allowNull: false,
			required: true
		},
		comments: {
			type: Sequelize.STRING,
			allowNull: true,
			required: false
		},
		days_applied: {
			type: Sequelize.INTEGER,
			allowNull: false,
			required: true
		},
		rejected_by: {
			type: Sequelize.STRING,
			allowNull: true,
			required: false,
			isEmail: true
		},
		rejection_reason: {
			type: Sequelize.STRING,
			allowNull: true,
			required: false
		},
		referal_reason: {
			type: Sequelize.STRING,
			allowNull: true, 
			required: false
		}
	})
	return Leaves
}