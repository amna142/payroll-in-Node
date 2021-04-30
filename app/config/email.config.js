const nodeMailer = require('nodemailer')
const sendMailerTransporter = require('nodemailer-sendgrid-transport')

//sendGrid
const transporter = nodeMailer.createTransport(sendMailerTransporter({
	auth: {
		api_key: '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'
	}
}))

const send_email = (email_to, email_from, cc_email, email_subject, email_body) => {
	console.log('email_body', email_body)
	return transporter.sendMail({
		to: email_to,
		from: email_from,
		cc: cc_email ? cc_email : null,
		subject: email_subject,
		html: email_body
	})
}


module.exports = {
	send_email: send_email,
	transporter: transporter
}