require('dotenv').config();
const express = require('express')

const app = express()
const session = require('express-session')
const bodyParser = require('body-parser')
const serveStatic = require('serve-static')

var SequelizeStore = require('connect-session-sequelize')(session.Store)
const db = require('./app/util/database')
const path = require('path')
const accountRoutes = require('./app/routes/authRoutes')
const adminRoutes = require('./app/routes/adminRoutes')
const logsRoutes = require('./app/routes/logsRoutes')
const settingsRoutes = require('./app/routes/settingsRoutes')
const preferences = require('./app/routes/preferencesRoutes')
const leavesRoutes = require('./app/routes/leaveRoutes')
const errorRoutes = require('./app/routes/errorRoutes')

const flash = require('connect-flash')
const secretKey = require('./app/config/secret')

app.use(bodyParser.urlencoded({
	extended: false
}))
app.use(express.json());
app.set('view engine', 'ejs')
app.set('views', 'views')


app.use('/', serveStatic(path.join(__dirname, 'app/assets')))
app.use('/', serveStatic(path.join(__dirname, 'public')))
app.use('/', serveStatic(path.join(__dirname, 'public/templates/images')))
var store = new SequelizeStore({
	db: db.sequelize,
});
app.use(session({
	secret: secretKey.key,
	store: store,
	resave: false,
	saveUninitialized: false
}));

store.sync();
app.use(flash())
app.use(accountRoutes)
app.use(adminRoutes)
app.use(settingsRoutes)
app.use(preferences)
app.use(leavesRoutes)
app.use(logsRoutes)
app.use(errorRoutes)

const PORT = process.env.WEB_PORT || 3000

//{force: true}
db.sequelize.sync().then(result => {
	
	app.listen(PORT, () => {
		// console.log(result)
		console.log(`Server is running on port ${PORT}`)
	})
}).catch(err => {
	console.log('Error in sequelizing data', err)
})