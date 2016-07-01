/**
 *  Patient related functions.
 */
function getPatients(start, batch) {
	var st = start ? start : 0;
	var b = batch ? parseInt(batch) : 50;
	$.getJSON('/patients/api/'+st+'/'+(b || 50), function(json, status, req) {
		if ('data' in json) {
			console.log('GOT DATA', json);
			var template = $('#tmpl_row').html();
			Mustache.parse(template);
			var tbody = $('#patients').empty();
			for (var i = 0; i < json.data.length; i++) {
				var rendered = Mustache.render(template, json.data[i]);
				tbody.append(rendered);
			}
		}
		else if ('error' in json) {
			console.error(json.error);
			if ('status' in json.error && 401 == json.error.status) {
				provokeLogin();
			}
		}
	 })
}
