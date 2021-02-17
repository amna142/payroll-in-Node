module.exports = (req, res, next) => {
	console.log('session', req.session)
	var isLoggedIn = req.session.isLoggedIn
	console.log('islogged', isLoggedIn)
	if (!isLoggedIn) {
		return res.redirect('/login')
	}
	next()
}