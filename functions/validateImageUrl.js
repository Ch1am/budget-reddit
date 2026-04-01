const IMAGE_EXT_IN_URL = /\.(png|jpe?g|gif|webp)(\?|#|\/|$)/i;

exports.validateImageUrl = (urlString) => {
	return typeof urlString === "string" && IMAGE_EXT_IN_URL.test(urlString.trim());
};

