/**
 *  General utility functions.
 */


/**
 *  Redirect to login.
 */
function provokeLogin(destination) {
	if (document.location.href != '/login') {
		document.location.href = '/login' + (destination ? '?dest='+destination : '');
	}
}
