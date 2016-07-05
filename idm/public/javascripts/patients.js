/**
 *  Patient related functions.
 */
function getPatients(searchstring, start, batch) {
	loadPatientData(searchstring, start, batch,
		function(data) {
			var template = $('#tmpl_row').html();
			Mustache.parse(template);
			var tbody = $('#patients').empty();
			for (var i = 0; i < data.length; i++) {
				var rendered = Mustache.render(template, data[i]);
				tbody.append(rendered);
			}
		},
		function(error) {
			if (error && 'status' in error && 401 == error.status) {
				provokeLogin();
			}
		}
	);
}

function loadPatientData(searchstring, start, batch, success, error) {
	var st = start ? start : 0;
	var b = batch ? parseInt(batch) : 50;
	$.getJSON('/patients/api/'+st+'/'+(b || 50), function(json, status, req) {
		if ('data' in json) {
			console.log('GOT DATA', json);
			success(json.data);
		}
		else if ('error' in json) {
			console.error(json.error);
			error(json.error);
		}
		else {
			error();
		}
	});
}

