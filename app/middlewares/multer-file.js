const multer = require('multer')
const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'files')
	},
	filename: (req, file, cb) => {
		cb(null, new Date().toISOString() + '-' + file.originalname)
	}
})

const fileFilter = (req, file, cb) => {
	if (file.mimetype === 'application/pdf') {
		cb(null, true)
	} else {
		cb(null, false)
	}
}

var uplaod = multer({
	fileStorage: fileStorage,
	fileFilter: fileFilter

})

module.exports = uplaod