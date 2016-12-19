/**
 *  Subject related functions.
 */
function getSubjects(searchstring, start, batch) {
	loadSubjectsData(searchstring, start, batch,
		function(data) {
			var template = $('#tmpl_row').html();
			Mustache.parse(template);
			if (data.length > 0) {
				var tbody = $('#subjects').empty();
				for (var i = 0; i < data.length; i++) {
					var rendered = Mustache.render(template, data[i]);
					tbody.append(rendered);
				}
			}
			else {
				var td = $('#loading').empty();
				td.append('<p>No subjects so far</p>');
				td.append('<p><a href="subjects/0">Add a subject</a></p>');
			}
		},
		function(error) {
			if (error) {
				if ('status' in error && 401 == error.status) {
					provokeLogin('/subjects');
				}
				else {
					var detail = ('message' in error) ? '<p>'+error['message']+'</p>' : '';
					$('#loading').html('<p class="error">Failed getting subjects</p>'+detail);
				}
			}
		}
	);
}

function loadSubjectsData(searchstring, start, batch, success, error) {
	var st = start ? start : 0;
	var b = batch ? parseInt(batch) : 50;
	$.getJSON('/subjects/api/'+st+'/'+(b || 50), function(json, status, req) {
		if ('data' in json) {
			success(json.data);
		}
		else if ('error' in json) {
			console.error("loadSubjectsData() error:", json.error);
			error(json.error);
		}
		else {
			error();
		}
	});
}

function showQRCode(sssid) {
	$.getJSON('/subjects/'+sssid+'/qrcode', function(json, status, req) {
		if ('qrcode' in json && json.qrcode) {
			showBlackout(qrCodeOverlay(json.qrcode));
		}
		else {
			console.error('showQRCode() error:', status, json);
			alert(('errorMessage' in json) ? json.errorMessage : "Could not retrieve QR code");
		}
	})
	.fail(function(req, status, error) {
		console.error('showQRCode() failed:', status, error);
		if (401 == req.status) {
			provokeLogin('/subjects');
		}
		else {
			alert(error);
		}
	});
}

function qrCodeOverlay(path) {
	var img = $('<img src="'+path+'" alt="QR Code"/>');
	var div = $('<div/>').addClass('qrpopover');
	div.append(img);
	img.click(removeBlackout);
	
	return div;
}

function showBlackout(element) {
	$('#blackout').remove();
	var parent = $('<div/>').attr({'id': 'blackout'});
	parent.append(element);
	parent.click(removeBlackout);
	
	$(document.body).append(parent);
}

function removeBlackout() {
	$('#blackout').fadeOut('fast', function() { $(this).remove(); });
}

