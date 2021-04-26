const dbConfig = require('../config/db.config')
const Sequelize = require('sequelize')

const DB = process.env.DB;
const USER = process.env.USER
const PASSWORD = process.env.PASSWORD
const SERVER = process.env.SERVER
const DIALECT = process.env.DIALECT
const PORT = process.env.PORT
const STORAGE = process.env.STORAGE
const INSTANCENAME = process.env.INSTANCENAME

console.log(DB);
console.log(USER);

const sequelize = new Sequelize(DB, USER, PASSWORD, {
	host: SERVER,
	dialect: DIALECT,
	port: PORT,
	storage: STORAGE,
	pool: {
		min: 0,
		max: 5,
		idle: 10000,
		acquire: 30000
	},
	dialectOptions: {
		instanceName: INSTANCENAME
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
db.employee_allowances = require('../models/employeeAllowances.js')(sequelize, Sequelize)
db.employee_funds = require('../models/employeeFunds.js')(sequelize, Sequelize)
db.company_funds = require('../models/funds.js')(sequelize, Sequelize)
db.attendance = require('../models/attendance.js')(sequelize, Sequelize)
db.time_entries = require('../models/timeEntries.js')(sequelize, Sequelize)
db.leave_types = require('../models/leaveTypes.js')(sequelize, Sequelize)
db.leave_qouta = require('../models/leaveQouta.js')(sequelize, Sequelize)
db.leaves = require('../models/leaves')(sequelize, Sequelize)
db.leave_request_status = require('../models/leaveRequestStatus')(sequelize, Sequelize)
db.company_preferences = require('../models/companyPreferences')(sequelize, Sequelize)
db.events = require('../models/events')(sequelize, Sequelize)
db.employee_leave_balance = require('../models/employeeLeaveBalance')(sequelize, Sequelize)
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




//employee grade with allowances -- many-to-many relation
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

//basic salaries with EmployeeAllownces and EmployeeFunds
//one-to-many for salary with employee Allowances

db.salaries.hasMany(db.employee_allowances, {
	foreignKey: {
		allowNull: true
	}
})
db.employee_allowances.belongsTo(db.salaries, {
	constraints: false,
	onDelete: null,
	onUpdate: 'CASCADE'
})

//one-to-many for salary with employee Funds
db.salaries.hasMany(db.employee_funds, {
	foreignKey: {
		allowNull: true
	}
})

db.employee_funds.belongsTo(db.salaries, {
	constraints: false,
	onDelete: null,
	onUpdate: 'CASCADE'
})


//employee grade with funds -- many-to-many relation
db.company_funds.belongsToMany(db.employee_grade, {
	through: 'EmpGrade_Funds',
	as: 'grades',
	foreignKey: "fund_id"
})
db.employee_grade.belongsToMany(db.company_funds, {
	through: 'EmpGrade_Funds',
	as: 'funds',
	foreignKey: 'grade_id'
})

//one-to-many relationship between attendance and time netries
db.attendance.hasMany(db.time_entries, {
	constraints: false,
	onDelete: null,
	onUpdate: 'CASCADE'
})

db.time_entries.belongsTo(db.attendance, {
	constraints: false,
	onDelete: null,
	onUpdate: 'CASCADE'
})

//leave types with leave Qouta :: 1 leave type have 1 leave qouta
// 1-to-1 relation

db.leave_types.hasOne(db.leave_qouta, {
	foreignKey: {
		allowNull: false
	}
})

db.leave_qouta.belongsTo(db.leave_types, {
	constraints: false,
	onDelete: null,
	onUpdate: 'CASCADE'
})

db.leave_types.hasOne(db.leaves, {
	foreignKey: {
		allowNull: false
	}
})
db.leaves.belongsTo(db.leave_types, {
	onDelete: null,
	constraints: false,
	onUpdate: 'CASCADE'
})

db.leave_request_status.hasOne(db.leaves, {
	foreignKey: {
		allowNull: false
	}
})

db.leaves.belongsTo(db.leave_request_status, {
	onDelete: null,
	constraints: false,
	onUpdate: 'CASCADE'
})

//leaves with employee -- 1-to-many relation

db.employee.hasMany(db.leaves, {
	constraints: true,
	onDelete: null,
	foreignKey: {
		allowNull: false
	},
	onUpdate: 'CASCADE'
})
db.leaves.belongsTo(db.employee, {
	constraints: true,
	onDelete: null,
	onUpdate: 'CASCADE'
})

//employee with employee leave balance has one-to-one relation
db.employee.hasOne(db.employee_leave_balance, {
	foreignKey: {
		allowNull: false
	}
})
db.employee_leave_balance.belongsTo(db.employee, {
	constraints: false,
	onDelete: null,
	onUpdate: 'CASCADE'
})
module.exports = db;