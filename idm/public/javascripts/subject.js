/**
 *  Functions to work with one subject.
 */


// MARK: - Research Data

function addResearchData(sssid) {
	var data = [{
		"id": "hcv-rna",
		"value": 666
	}];
	$.ajax({type: 'POST', url: '/subjects/'+sssid+'/addData', data: JSON.stringify({'data': data}), contentType : 'application/json'})
	.done(function(json, status, req) {
		if (status.errorMessage) {
			console.error('addResearchData error: ', json);
			alert(json.errorMessage + ", please try again");
		}
		else {
			console.log('addResearchData done', json);
		}
	})
	.fail(function(req, status, error) {
		console.log('addResearchData fail', req, status, error);
		if (401 == req.status) {
			provokeLogin('/subjects/'+sssid);
		}
		else {
			alert(error);
		}
	})
}

