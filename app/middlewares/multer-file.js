

const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
	destination: (req, file, cb) =>{
		cb(null, 'files')
	},
	filename: (req, file, cb) =>{
		cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
	}
})


// const error = (req, res, next) =>{
// 	if(err){
// 		console.log('err', err)
// 		req.flash('error', 'error while uploading file')
// 		return next(err)
// 	}
// }	

const fileFilter = (req, file, cb) => {
	console.log('file amna here', file)
	if (file.mimetype === 'application/pdf' || file.mimetype === 'application/octet-stream' || file.mimetype === 'application/vnd.ms-excel') {
		cb(null, true)
	} else {
		req.flash('error', 'file type is not supported')
		cb(null, false)
	}
}
const userProfileFilter = (req, file, cb) =>{
	console.log('image file amna here', file)
	if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
		cb(null, true)
	} else {
		req.flash('error', 'image file type is not supported')
		cb(null, false)
	}
}

var uplaod = multer({
	storage: storage,
	// onError: error,
	fileFilter: fileFilter,
	userProfileFilter: userProfileFilter
	
})

module.exports = uplaod