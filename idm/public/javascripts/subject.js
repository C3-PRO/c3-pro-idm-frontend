/**
 *  Functions to work with one subject.
 */


// MARK: - Research Data

function addResearchData(sssid) {
	$('#addingStatus').append("Adding...");
	$('#addingButton').prop('disabled', true);
	var tbl = $('#research-data');
	
	// collect values
	var data = tbl.find('.data-item-value').map(function() {
		if ($(this).val()) {
			var id = $(this).attr('id');
			return {
				id: id,
				value: $(this).val(),
				datetime: $('#date_'+id).val(),
			}
		}
	});
	if (0 == data.length) {
		$('#addingStatus').empty();
		$('#addingButton').prop('disabled', false);
		return;
	}
	
	// POST data
	$.ajax({type: 'POST', url: '/subjects/'+sssid+'/addData', data: JSON.stringify({'data': data}), contentType : 'application/json'})
	.done(function(json, status, req) {
		if (json.errorMessage) {
			$('#addingStatus').empty();
			reportError(status, json, 'addResearchData')
			$('#addingButton').prop('disabled', false);
		}
		else {
			$('#addingStatus').empty().append('<span class="success">Added!</span>');
			window.setTimeout("$('#addingButton').prop('disabled', false);", 5000);
		}
	})
	.fail(function(req, status, error) {
		if (401 == req.status) {
			provokeLogin('/subjects/'+sssid);
		}
		else {
			reportError(status, {errorMessage: error}, 'addResearchData')
		}
		$('#addingStatus').empty();
		$('#addingButton').prop('disabled', false);
	})
}

function formatDateTime(elem, format) {
	var obj = $(elem);
	var value = obj.val();
	if (value) {
		var iso = moment(value);
		if (!iso.isValid() || iso.year() < 1900 || iso.year() > 2100) {
			obj.addClass('error');
		}
		else {
			obj.removeClass('error');
			obj.val(iso.format(format ? format : 'YYYY-MM-DD HH:mm'));
		}
	}
	else {
		obj.removeClass('error');
	}
}

function enableDisableAddingButton() {
	$('#addingButton').prop('disabled', !allInputDataValid());
}

function allInputDataValid(parent) {
	var fails = $(parent).find('.date-validate').map(function() {
		return $(this).hasClass('error') ? 1 : 0;
	}).get();
	return fails.indexOf(1) < 0;
}


// MARK: - Audit Log

function loadAuditHistory(sssid, elem) {
	loadAuditData(sssid,
		function(audits) {
			var tbody = $(elem);
			if (audits && audits.length > 0) {
				tbody.empty();
				
				var template = $('#tmpl_audit').html();
				Mustache.parse(template);
				for (var i = 0; i < audits.length; i++) {
					var treated = treatedAuditData(audits[i]);
					var rendered = Mustache.render(template, treated);
					tbody.append(rendered);
				}
			}
			else {
				tbody.find('.message').empty().text("No activity logged");
			}
		},
		function(error) {
			console.error("loadAuditHistory() failed:", error);
			var detail = ('errorMessage' in error) ? '<p>'+error.errorMessage+'</p>' : error;
			$(elem).find('.message').empty().append(detail);
		}
	);
}

function loadAuditData(sssid, successCB, errorCB) {
	if (!sssid) {
		errorCB({errorMessage: "No sssid given, aborting"});
		return;
	}
	$.getJSON('/subjects/api/audit/'+sssid, function(json, status, req) {
		if ('data' in json) {
			successCB(json.data);
		}
		else {
			errorCB(json);
		}
	})
	.fail(function(req, status, error) {
		console.error('loadAuditData() failed:', status, error);
		if (401 == req.status) {
			provokeLogin('/subject/'+sssid);
		}
		else {
			errorCB(error);
		}
	});
}

function treatedAuditData(data) {
	if (data.datetime) {
		data.humanDateTime = moment(data.datetime).format('lll');
	}
	return data;
}

