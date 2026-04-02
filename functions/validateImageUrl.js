// http:// or https://, path with extension; optional query string. Case-insensitive extension.
const IMAGE_URL_PATTERN =
	/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i;

// 10 seconds timeout
const FETCH_TIMEOUT_MS = 10_000;

exports.validateImageUrl = async (urlString) => {
	if (typeof urlString !== "string" || !urlString.trim()) 
		return false;

	const trimmed = urlString.trim();
	if (!IMAGE_URL_PATTERN.test(trimmed)) 
		return false;

	//prevent hanging requests
	const ctrl = new AbortController();
	const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

	try {
		const response = await fetch(trimmed, {
			method: "HEAD",
			signal: ctrl.signal,
		});
		
		//response headers include metadata like Content-Type: image/jpeg
		const contentType = response.headers.get("Content-Type");
		
		//check if the content type starts with image/
		return !!(contentType && contentType.startsWith("image/"));
	} catch {
		return false;

	} finally {
		//clear timeout so nothing is waiting
		clearTimeout(t);
	}
};
