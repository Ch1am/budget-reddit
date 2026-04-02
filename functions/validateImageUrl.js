// http:// or https://, path with extension; optional query string. Case-insensitive extension.
const IMAGE_URL_PATTERN =
	/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i;

exports.validateImageUrl = (urlString) => {
	if (typeof urlString !== "string") return false;
	const trimmed = urlString.trim();
	if (!trimmed) return false;
	return IMAGE_URL_PATTERN.test(trimmed);
};
