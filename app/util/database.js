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
db.logs = require('../models/auditLogs.js')(sequelize, Sequelize)
db.employee_grade = require('../models/employeeGrade.js')(sequelize, Sequelize)
db.salaries = require('../models/salaries.js')(sequelize, Sequelize)
db.allowances = require('../models/allowances.js')(sequelize, Sequelize)
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

//employee grade with employee
db.employee_grade.hasMany(db.employee, {
	foreignKey: {
		allowNull: true
	}
})
db.employee.belongsTo(db.employee_grade, {
	constraints: false,
	onDelete: null,
	onUpdate: 'CASCADE'
})

//employee with salaries: one-to-one relation
db.employee.hasOne(db.salaries, {
	foreignKey: {
		allowNull: false
	}
})
db.salaries.belongsTo(db.employee, {
	constraints: false,
	onDelete: null,
	onUpdate: 'CASCADE'
})


//employee grade with alloeances -- many-to-many relation
db.allowances.belongsToMany(db.employee_grade, {
	through: 'EmpGrade_Allowances',
	as: 'grades',
	foreignKey: "allowance_id"
})
db.employee_grade.belongsToMany(db.allowances, {
	through: 'EmpGrade_Allowances',
	as: 'allowances',
	foreignKey: 'grade_id'
})






module.exports = db;