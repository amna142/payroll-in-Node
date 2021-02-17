exports.get404 = (req, res) => {
	let isAuthenticated = req.session.isLoggedIn
	let url = ''
	if (isAuthenticated) {
		url = '/home'
	} else {
		url = '/login'
	}
	res.render('404/Error404', {
		url: url
	})
}