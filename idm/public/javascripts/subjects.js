/**
 *  Subject related functions.
 */
function getSubjects(searchstring, start, batch) {
	loadSubjectData(searchstring, start, batch,
		function(data) {
			var template = $('#tmpl_row').html();
			Mustache.parse(template);
			var tbody = $('#subjects').empty();
			for (var i = 0; i < data.length; i++) {
				var rendered = Mustache.render(template, data[i]);
				tbody.append(rendered);
			}
		},
		function(error) {
			if (error && 'status' in error && 401 == error.status) {
				provokeLogin('/subjects');
			}
		}
	);
}

function loadSubjectData(searchstring, start, batch, success, error) {
	var st = start ? start : 0;
	var b = batch ? parseInt(batch) : 50;
	$.getJSON('/subjects/api/'+st+'/'+(b || 50), function(json, status, req) {
		if ('data' in json) {
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

function showQRCode(sssid) {
	$.getJSON('/subjects/'+sssid+'/qrcode', function(json, status, req) {
		if ('body' in json) {
			console.log('showQRCode()', json, status);
		}
		else {
			console.error(status, json);
			var msg = ('errorMessage' in json) ? json.errorMessage : "Could not retrieve QR code";
			alert(msg);
		}
	})
	.fail(function(req, status, error) {
		console.error(status, error);
		if (401 == req.status) {
			provokeLogin('/subjects');
		}
		else {
			alert(error);
		}
	});
}
