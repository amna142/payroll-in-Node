const dbConfig = require('../config/db.config')
const Sequelize = require('sequelize')

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
	host: dbConfig.SERVER,
	dialect: dbConfig.DIALECT,
	port: dbConfig.PORT,
	storage: dbConfig.STORAGE,
	pool: {
		min: 0,
		max: 5,
		idle: 10000,
		acquire: 30000
	},
	dialectOptions: {
		instanceName: dbConfig.INSTANCENAME
	}
})
//test connection 

sequelize.authenticate().then(() => {
	console.log('connection has made successfully')
}).catch(err => {
	console.log('Unable to connect to database:', err)
})


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize

db.employee = require('../models/employees.js')(sequelize, Sequelize)
db.role = require('../models/roles.js')(sequelize, Sequelize)
db.employee_type = require('../models/employeeType.js')(sequelize, Sequelize)
db.employee_designation = require('../models/employeeDesignation.js')(sequelize, Sequelize)

//1 employee can have many roles
//1 role can be assigend to many employees (1(role) -> many(employees))

db.role.hasMany(db.employee)
db.employee.belongsTo(db.role, {
	constraints: false,
	onDelete: null,
	onUpdate: 'CASCADE'
})


//each employee in an organziation has an employee type
//employee can be permanenet, probationary and internee etc
db.employee_type.hasMany(db.employee, {
	foreignKey: {
		allowNull: false
	}
})

db.employee.belongsTo(db.employee_type, {
	constraints: false,
	onDelete: null,
	onUpdate: 'CASCADE'
})


//each employee in an organziation has an designation type against every employee
//employee designation can be software engineer, QA engineer etc

db.employee_designation.hasMany(db.employee, {
	foreignKey: {
		allowNull: false
	}
})
db.employee.belongsTo(db.employee_designation, {
	constraints: false,
	onDelete: null,
	onUpdate: 'CASCADE'
})


module.exports = db;