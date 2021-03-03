exports.alertMessage = (message) => {
	$(document).ready(function () {
		M.toast({
			html: message
		})
	})

}