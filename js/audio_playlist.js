var AUDIO_PLAYLIST = (function(){
	var audio,
		playlist,
		tracks,
		current,
		jumptotime,
		do_loop = true;

	var init = function(){
		current = 0;
		audio = $('#audio');
		playlist = $('#tracks');
		tracks = playlist.find('a');
		var len = tracks.length - 1;
		audio[0].volume = 1;

		if (tracks.length < 2) {
			do_loop = false; // don't loop on singles
		}

		playlist.find('.progress_bar').click(function(e){
			e.preventDefault();
			if ($(this).closest(".active").length == 0) { // only deal with current track
				return;
			}
			link = $(this).siblings('a');
			current = link.parent().index();
			var click_position = getPositionOfClick(e);
			jumptotime = click_position.hpercent;
			run(link, audio[0], false);
		});

		playlist.find('a').click(function(e){
			e.preventDefault();
			link = $(this);
			current = $(this).parent().index();
			run(link, audio[0], false);
		});

		audio[0].addEventListener('play',function(e){
			if (jumptotime) {
				var src_element = e.srcElement || e.target;
				var jt_sec = src_element.duration * jumptotime;
				src_element.currentTime = jt_sec;
				jumptotime = null;
				statlog('jumpto', jt_sec);
			}
		});

		audio[0].addEventListener('ended',function(e){
			statlog('finished');
			current = getNextPlayableTrackIndex(current);
			if (current != null) {
				link = playlist.find('a')[current];
				run($(link),audio[0]);
			} else {
				var par = $(playlist.find('a')[0]).parent();
				$('.progress_indicator').css("width","0%"); // reset all indicators
				par.removeClass('is_playing').siblings().removeClass('is_playing');
				par.addClass('active').siblings().removeClass('active');
				current = 0;
			}
		});
	}

	var getNextPlayableTrackIndex = function(current_index) {
		var next_track_index = null;
		var all_tracks = playlist.find("a");
		$(all_tracks).each(function(i,v){
			if (i > current_index && $(all_tracks[i]).data("src") != "") {
				next_track_index = i;
				return false;
			}
		});
		if (next_track_index == null) { // case in which no 'next' was found in >indices, try starting at 0
			$(all_tracks).each(function(i,v){
				if (i <= current_index && $(all_tracks[i]).data("src") != "") {
					next_track_index = i;
					if (do_loop == false) {
						next_track_index = null;
					}
					return false;
				}
			});
		}
		return next_track_index;
	};

	var getPositionOfClick = function(clickEvent) {
		var width = clickEvent.currentTarget.offsetWidth;
		var pos = clickEvent.pageX;
		var offset = $(clickEvent.currentTarget).offset().left;
		var h_percent_click = (pos-offset)/width;

		var height = clickEvent.currentTarget.offsetHeight;
		pos = clickEvent.pageY;
		offset = clickEvent.currentTarget.offsetTop;
		var v_percent_click = (pos-offset)/height;
		return {"hpercent":h_percent_click, "vpercent":v_percent_click};
	};

	var run = function (link, player, is_paused){
		var new_src = link.data("src").replace(/^(s|f)(\/.+)$/, function(m,m1,m2) {
			return atob('Ly9jb250ZW50LmNkYmFieS5jb20vYXVkaW8v')+atob(m1=='s'?'c2FtcGxlcw==':'ZnVsbA==') + m2;
		});
		var par = link.parent();
		var is_match = (new_src.split("//")[1] == player.src.split("//")[1]); // ignore protocol for matching
		// first, check if player is playing this track already. if so, pause it
		if (is_match) {
			if (audio[0].paused) {
				statlog('unpause');
				audio[0].play();
				par.addClass("is_playing");
			} else {
				audio[0].pause();
				if (jumptotime) {
					audio[0].play(); // will trigger play event, which will jumptotime
				} else {
					statlog('pause');
					par.removeClass("is_playing");
				}
			}
			return;
		}

		$('.progress_indicator').css("width","0%"); // reset all indicators
		player.src = new_src;
		par.addClass('is_playing').siblings().removeClass('is_playing');
		par.addClass('active').siblings().removeClass('active');

		audio[0].load();
		if (is_paused != true) {
			statlog('play');
			audio[0].play();
			audio[0].addEventListener("timeupdate", function(e){
				var src_element = e.srcElement || e.target;
				var percent_complete = 100 * (src_element.currentTime / src_element.duration);
				$('.active .progress_indicator').css("width", percent_complete + "%");
			});
		} else {
			par.removeClass('is_playing');
		}
	};

	var statlog = function (action, jumpto) {
		jumpto = jumpto || '';
		if(typeof _paq == 'undefined') {
			return;
		}
		if(jumpto !== '') {
			jumpto = Math.round(jumpto).toString() + 's';
		}
		_paq.push(['trackEvent', 'stream_' + action, (current + 1), jumpto]);
	};

	var canSupportAudioAndMp3 = function() {
		var a = document.createElement('audio');
		return !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
	};

	var playPauseCurrentTrack = function() {
		var link = $("#tracks").find("a")[current];
		run($(link), audio[0], false);
	};

	return {
		init: init,
		canSupportAudioAndMp3: canSupportAudioAndMp3,
		playPauseCurrentTrack: playPauseCurrentTrack
	}
}());
