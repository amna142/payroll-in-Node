const db = require('../util/database')
const bcrypt = require('bcrypt')
const nodeMailer = require('nodemailer')
const {
	Op
} = require("sequelize");
const sendMailerTransporter = require('nodemailer-sendgrid-transport')
const crypto = require('crypto');
const {
	DefaultDeserializer
} = require('v8');
const { url } = require('inspector');


const transporter = nodeMailer.createTransport(sendMailerTransporter({
	auth: {
		api_key: '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'
	}
}))


exports.getLogin = (req, res) => {
	let message = req.flash('error')
	if (message.length > 0) {
		message = message[0]
	} else {
		message = null
	}
	let isLoggedIn = req.session.isLoggedIn
	let url = ''
	if(isLoggedIn){
		url = '/home'
	}else { url = '/login'}

	console.log('isLoggedIn for login page', isLoggedIn)
	//show login page
	res.render('auth/login', {
		path: '/login',
		pageTitle: 'Login',
		isAuthenticated: isLoggedIn,
		url: url,
		errorMessage: message
	})
}

//login request 

exports.postLogin = (req, res) => {

	console.log('req.body', req.body)
	var empEmail = req.body.email;
	var empPassword = req.body.password
	db.employee.findOne({
		where: {
			email: empEmail
		},
		include: [{
			model: db.role
		}]
	}).then(employee => {
		if (!employee) {
			console.log('no user found')
			req.flash('error', 'No User Exist')
			res.redirect('/login')
		} else {
			if (employee) {
				if (employee.roleId !== null) {
					console.log('employee.role', employee.role.dataValues.title)
					let title = employee.role.dataValues.title
					if (title === 'admin') {
						console.log('outside')
						if (empPassword == employee.password) {
							req.session.isLoggedIn = true
							req.session.user = employee
							return req.session.save(err => {
								console.log('err in saving session', err)
								console.log('req.session.user.title', req.session.user.title)
								res.redirect('/home')
							})
						} else {
							console.log('error in comapring password for admin')
							req.flash('error', 'Invalid Password')
							res.redirect('/login')
						}
						// res.setHeader('Set-Cookie', 'adminLoggedIn=true') -- Setting Cookie isn't a good appraoch
					}
				} else {
					console.log('empPassword', empPassword + employee.password)
					var isPasswordValid = bcrypt.compareSync(empPassword, employee.password)
					console.log('isPasswordValid', isPasswordValid)
					if (isPasswordValid) {
						req.session.isLoggedIn = true;
						req.session.user = employee
						res.redirect('/home')
					} else {
						console.log('error in comapring password')
						req.flash('error', 'Invalid Password')
						res.redirect('/login')
					}
				}
				//roles are there but see if there's admin
			}
		}
	}).finally(() => {
		db.sequelize.close
	})
}

//logout request

exports.postLogout = (req, res, next) => {
	req.session.destroy((err) => {
		console.log('error in logoutController function')
		res.redirect('/login')
	})
}

//reset password 

exports.getReset = (req, res, next) => {
	let message = req.flash('error')
	if (message.length > 0) {
		message = message[0]
	} else {
		message = null
	}
	let isLoggedIn = req.session.isLoggedIn
	res.render('auth/reset', {
		path: '/reset',
		pageTitle: 'Reset Password',
		isAuthenticated: isLoggedIn,
		errorMessage: message
	})
}


exports.postReset = (req, res, next) => {
	let email = req.body.email
	crypto.randomBytes(32, (err, buffer) => {
		if (err) {
			console.log('error in reset', err)
			return res.redirect('/reset')
		}
		const token = buffer.toString('hex')
		db.employee.findOne({
			where: {
				email: email
			}
		}).then(employee => {
			console.log('employe Found by EMail', employee)
			if (!employee) {
				console.log('i am inside')
				require.flash('error', 'No user with That Email Found')
				return req.redirect('/reset')
			}
			console.log('resetting token')
			employee.resetToken = token;
			employee.resetTokenExpiration = Date.now()
			return employee.save()
		}).then((result) => {
			req.flash('error', 'An Email has been sent. Check your Inbox')
			//here we have to send email
			res.redirect('/login')
			return transporter.sendMail({
				to: email,
				from: 'amna@dynasoftcloud.com',
				subject: 'Password Reset',
				html: `
				<p>You requested a password reset</p>
				<p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
				`
			})
		}).catch((err) => {
			console.log('err', err)
		})
	})
}


exports.getNewPassword = (req, res, next) => {

	var token = req.params.token
	console.log('date', Date.now())
	//find employee of the reset token
	db.employee.findOne({
		where: {
			resetToken: token
		}
	}).then(employee => {
		if (employee) {
			let message = req.flash('error')
			if (message.length > 0) {
				message = message[0]
			} else {
				message = null
			}
			let isLoggedIn = req.session.isLoggedIn
			res.render('auth/new-password', {
				path: '/new-password',
				pageTitle: 'Update Password Password',
				isAuthenticated: isLoggedIn,
				errorMessage: message,
				userId: employee.dataValues.id,
				passwordToken: token
			})
		} else {
			console.log('no employee found')
			req.flash('error', 'No User Found')
		}
	}).catch((err) => {
		req.flash('error', 'No Employee Exist')
		console.log('error in finding employee', err)
	})

}
exports.postNewPassword = (req, res, next) => {
	let newPassword = req.body.password
	let confirmPassword = req.body.confirmPassword
	let resetUser;
	if (newPassword == confirmPassword) {
		let token = req.body.passwordToken
		let userId = req.body.userId
		db.employee.findOne({
				where: {
					resetToken: token,
					id: userId
				}
			}).then(employee => {
				console.log('employee found', employee)
				resetUser = employee
				return bcrypt.hashSync(newPassword, 8)
			}).then((hashedPassword) => {
				resetUser.password = hashedPassword;
				resetUser.token = undefined;
				resetUser.resetTokenExpiration = undefined
				resetUser.save()
			}).then(result => {
				req.flash('error', 'Login with New Password')
				res.redirect('/login')
			})
			.catch(err => {
				console.log('employee not found', err)
			})
	} else {
		req.flash('error', 'please Enter Password and Confirm Password Same')
		console.log('please enter password and confirm password same')
	}
}