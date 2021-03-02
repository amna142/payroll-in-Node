module.exports = (req, res, next) => {
	var isLoggedIn = req.session.isLoggedIn
	console.log('islogged', isLoggedIn)
	if (!isLoggedIn) {
		return res.redirect('/login')
	}
	next()
}