/**
 *  Subject related functions.
 */


/**
Get `num` most recently worked on subjects.

TODO: this means globally changed subjects, should track per user.
*/
function getRecentSubjects(num, callback) {
	var use_num = num || 3;
	loadSubjectsData(null, 0, use_num+1, 'changed', 'DESC',
		function(data) {
			var tbl = $('#recent');
			var num = renderSubjectsInto(data, tbl, use_num);
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
				$('#recent .loading').html('<p class="error">Failed retrieving recent subjects</p>'+detail);
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
					$('#loading').html('<p class="error">Failed retrieving subjects</p>'+detail);
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

function renderSubjectsInto(data, table, max) {
	var template = $('#tmpl_row').html();
	Mustache.parse(template);
	if (data.length > 0) {
		var tbody = table.empty();
		var stop = (max > 0) ? Math.min(max, data.length) : data.length;
		for (var i = 0; i < stop; i++) {
			var treated = treatedSubjectData(data[i]);
			var rendered = Mustache.render(template, treated);
			tbody.append(rendered);
		}
	}
	return data.length;
}

function treatedSubjectData(data) {
	if (data.bday) {
		data.birthDate = moment(data.bday).format('L');
	}
	if (data.date_changed) {
        data.changedDate = moment(data.date_changed).format('lll');
    }
    if (data.date_invited) {
        data.invitedDate = moment(data.date_invited).format('lll');
    }
    if (data.date_consented) {
        data.consentedDate = moment(data.date_consented).format('lll');
    }
    if (data.date_enrolled) {
        data.enrolledDate = moment(data.date_enrolled).format('lll');
    }
    if (data.date_withdrawn) {
        data.withdrawnDate = moment(data.date_withdrawn).format('lll');
    }
	return data;
}


// MARK: - Consenting

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


// MARK: - QR Code

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

