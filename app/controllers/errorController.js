exports.get404 = (req, res) => {
	let isAuthenticated = req.session.isLoggedIn
	let url = ''
	if (isAuthenticated) {
		url = '/'
	} else {
		url = '/login'
	}
	res.render('Error/Error404', {
		url: url
	})
}