var TRACK_REFRESHER = (function() {
	var a_id,
		get_timeout,
		album_data,
		delay = 7200000;

	var init = function(init_id, ms_until_update) {
		a_id = init_id;
		startTimer(ms_until_update);
		$.ajaxPrefilter(function(options, originalOptions, xhr) {
			var token = $('meta[name="csrf-token"]').attr("content");
			if (token) {
				return xhr.setRequestHeader("X-CSRF-TOKEN", token);
			}
		});
	};

	var startTimer = function(tdelay) {
		clearTimeout(get_timeout);
		get_timeout = setTimeout(function(){
			$.post("/rest/tracks", { id: a_id }, function(data) {
				album_data = data;
				updateTrackUrls();
			})
			.fail(function() {
				return false;
			});
		},tdelay);
	}

	var updateTrackUrls = function() {
		for(var i in album_data) {
			var btn = $("a.track_number"+i);
			if(album_data[i].length > 0) {
				btn.attr("data-src", album_data[i]).removeClass("play_hidden");
			} else {
				btn.attr("data-src", "").addClass("play_hidden");
			}
		};
		album_data = null;
		startTimer(delay);
	}

	return {
		init: init
	}
}());
