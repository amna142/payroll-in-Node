module.exports = (sequelize, Sequelize) => {
	const AuditLogs = sequelize.define('audit_logs', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			required: true
		},
		action: {
			type: Sequelize.STRING,
			allowNull: true,
			required: false
		},
		record_type: {
			type: Sequelize.STRING,
			allowNull: false,
			required: false
		},
		field_id: {
			type: Sequelize.STRING,
			required: false,
			allowNull: true
		},
		old_value: {
			type: Sequelize.STRING,
			allowNull: true,
			required: false
		}, 
		new_value: {
			type: Sequelize.STRING,
			allowNull: true,
			required: false
		},
		date: {
			type: Sequelize.DATE,
			allowNull: true,
			required: false
		},
		time: {
			type: Sequelize.TIME,
			allowNull: true, 
			required: false
		},
		name: {
			type: Sequelize.STRING,
			allowNull: false,
			required: true
		}
	});
	return AuditLogs
}