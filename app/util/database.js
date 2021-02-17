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
db.role= require('../models/roles.js')(sequelize, Sequelize)

db.role.hasMany(db.employee)
db.employee.belongsTo(db.role, {constraints: false, onDelete: null, onUpdate: 'CASCADE'})
// db.employee.hasMany(db.role)
// db.role.belongsTo(db.employee, {constraints: false, onDelete: null, onUpdate: 'CASCADE'})

module.exports = db;