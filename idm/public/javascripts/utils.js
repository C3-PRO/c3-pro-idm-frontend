/**
 *  Public JavaScript utility functions.
 */


/** Log and report an error. */
function reportError(status, json, logPrefix, fallback) {
	console.error(logPrefix || 'Error:', status, json);
	if (json.errorMessage || fallback) {
		alert(json.errorMessage || fallback)
	}
}

