const nodeMailer = require('nodemailer')
const sendMailerTransporter = require('nodemailer-sendgrid-transport')


const transporter = nodeMailer.createTransport(sendMailerTransporter({
	auth: {
		api_key: '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'
	}
}))



module.exports = {
	transporter: transporter
}