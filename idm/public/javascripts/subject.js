/**
 *  Functions to work with one subject.
 */


// MARK: - Research Data

function addResearchData(sssid) {
	$('#addingStatus').append("Adding...");
	$('#addingButton').prop('enabled', false);
	var tbl = $('#research-data');
	var data = tbl.find('.form-control').map(function() {
		if ($(this).val()) {
			return {
				id: $(this).attr('id'),
				value: $(this).val(),
			}
		}
	});
	if (0 == data.length) {
		$('#addingStatus').empty();
		$('#addingButton').prop('enabled', true);
		return;
	}
	
	// POST data
	$.ajax({type: 'POST', url: '/subjects/'+sssid+'/addData', data: JSON.stringify({'data': data}), contentType : 'application/json'})
	.done(function(json, status, req) {
		if (status.errorMessage) {
			$('#addingStatus').empty();
			reportError(status, json, 'addResearchData')
		}
		else {
			$('#addingStatus').empty().append('<span class="success">Added!</span>');
		}
		$('#addingButton').prop('enabled', true);
	})
	.fail(function(req, status, error) {
		if (401 == req.status) {
			provokeLogin('/subjects/'+sssid);
		}
		else {
			reportError(status, {errorMessage: error}, 'addResearchData')
		}
		$('#addingStatus').empty();
		$('#addingButton').prop('enabled', true);
	})
}

