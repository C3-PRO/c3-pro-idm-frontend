/**
 *  Subject related functions.
 */


/**
Get `num` most recently worked on subjects.
*/
function getRecentSubjects(num, callback) {
	loadSubjectsData(null, 0, num || 3, 'changed', 'DESC',
		function(data) {
			var tbl = $('#recent');
			var num = renderSubjectsInto(data, tbl);
			if (0 == num) {
				var td = tbl.find('.loading').empty();
				td.append('<p>No subjects</p>');
				td.append('<p><a href="subjects/0">Add a subject</a></p>');
			}
			callback(num);
		},
		function(error) {
			if (error && 401 == error.statusCode) {
				provokeLogin('/subjects');
			}
			else {
				var detail = (error && 'errorMessage' in error) ? '<p>'+error.errorMessage+'</p>' : '';
				$('#recent .loading').html('<p class="error">Failed getting recent subjects</p>'+detail);
			}
		}
	);
}

function getSubjects(searchstring, start, batch) {
	loadSubjectsData(searchstring, start, batch, 'name', 'ASC',
		function(data) {
			var tbl = $('#subjects');
			renderSubjectsInto(data, tbl);
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

function loadSubjectsData(searchstring, start, batch, orderCol, orderDir, successCB, errorCB) {
	var st = start ? start : 0;
	var b = batch ? parseInt(batch) : 50;
	var oCol = orderCol || 'name';
	var oDir = (orderDir && 'desc' == orderDir.toLowerCase()) ? orderDir : 'ASC';
	var url = '/subjects/api/'+st+'/'+(b || 50)+'/'+oCol+'/'+oDir;
	$.getJSON(url + (searchstring ? '&search='+encodeURI(searchstring) : ''), function(json, status, req) {
		if ('data' in json) {
			successCB(json.data);
		}
		else {
			errorCB(json);
		}
	})
	.fail(function(req, status, error) {
		console.error('loadSubjectsData() failed:', status, error);
		if (401 == req.status) {
			provokeLogin('/subjects');
		}
		else {
			errorCB(error);
		}
	});
}

function renderSubjectsInto(data, table) {
	var i = 0;
	var template = $('#tmpl_row').html();
	Mustache.parse(template);
	if (data.length > 0) {
		var tbody = table.empty();
		for (; i < data.length; i++) {
			var rendered = Mustache.render(template, data[i]);
			tbody.append(rendered);
		}
	}
	return i+1;
}

function markConsented(sssid) {
	if (confirm("This will mark the subject as having completed consent.\n\nDo you want to record consent?")) {
		doMarkConsented(sssid);
	}
}

function doMarkConsented(sssid) {
	$.getJSON('/subjects/'+sssid+'/didConsent', function(json, status, req) {
		if ('data' in json && json.data) {
			var template = $('#tmpl_row').html();
			var rendered = Mustache.render(template, json.data);
			$('.row_'+sssid).replaceWith(rendered);
		}
		else {
			reportError(status, json, 'markConsented() error:', "Failed to mark subject as consented");
		}
	})
	.fail(function(req, status, error) {
		console.error('markConsented() failed:', status, error);
		if (401 == req.status) {
			provokeLogin('/subjects');
		}
		else {
			alert(error);
		}
	});
}

function showQRCode(sssid) {
	$.getJSON('/subjects/'+sssid+'/qrcode', function(json, status, req) {
		if ('data' in json && json.data) {
			showBlackout(qrCodeOverlay(json.data));
		}
		else if ('statusCode' in json && 401 == json.statusCode) {
			provokeLogin('/subjects');
		}
		else {
			reportError(status, json, 'showQRCode() error:', "Could not retrieve QR code");
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

