import * as canvas from "./canvas.js";
import * as audio from "./audio.js";
import * as utils from "./utils.js";

let controlElement, playButton, volumeIndicator, volumeSlider, fullscreenButton;
let hideTime = 120, timeShown = 0;

function init(){
	controlElement = document.querySelector("#playbackControls");
	
	//Window events
	window.addEventListener("mousedown", function(e){
		//Show controls if the mouse was clicked'
		if (e.button == 0){
			showControls();
		}
	});
	window.addEventListener("mousemove", function(e){
		//Show controls if the mouse was moved to within the bottom 1/4th of the page
		let yPos = e.pageY - canvas.canvas.offsetTop;
		if (yPos > window.innerHeight - window.innerHeight / 4){
			showControls();	
			timeShown = -1;
		}else if (timeShown < 0){
			timeShown = 0;
			hideControls();
		}
	});
	window.addEventListener("mouseout", function(e){
		timeShown = 0;
		hideControls();
	});

	//Buttons
	playButton = document.querySelector("#playButton");
	playButton.onclick = function(e){
		if (e.target.dataset.playing == "no"){
			play();
		}else{
			pause();
		}
	}

	volumeIndicator = document.querySelector("#volumeIndicator");
	volumeIndicator.onclick = function(e){
		if (volumeIndicator.dataset.muted == "false"){
			volumeIndicator.dataset.muted = "true";
		}else{
			volumeIndicator.dataset.muted = "false";
		}
		audio.mute();
		updateVolumeIndicator();
	}
	volumeSlider = document.querySelector("#volumeSlider");
	volumeSlider.oninput = function(e){
		audio.setVolume(e.target.value);
		volumeIndicator.dataset.muted = "false";
		updateVolumeIndicator();
	}
	volumeSlider.dispatchEvent(new Event("input"));

	fullscreenButton = document.querySelector("#fullscreenButton");
	fullscreenButton.onclick = function(e){
		utils.toggleFullscreen(document.documentElement);
	}

	//Keyboard controls

}

function update(){
	if (timeShown > 0){
		timeShown--;
	}else if (timeShown == -1){
		showControls();
		timeShown = -1;
	}else{
		hideControls();
	}
}

function updateVolumeIndicator(){
	if (volumeIndicator.dataset.muted == "true" || volumeSlider.value == 0){
		volumeIndicator.innerHTML = "&#x1F568;";
	}else if (volumeSlider.value > volumeSlider.max / 2){
		volumeIndicator.innerHTML = "&#x1F56A;";
	}else{
		volumeIndicator.innerHTML = "&#x1F569;";
	}
}

function showControls(){
	timeShown = hideTime;
	controlElement.dataset.hidden = "false";
}

function hideControls(){
	controlElement.dataset.hidden = "true";
}

function togglePlay(){
	playButton.dispatchEvent(new Event("click"));
}

function play(){
	if (audio.audioCtx.state == "suspended"){
		audio.audioCtx.resume();
	}
	if (playButton.dataset.playing == "no"){
		audio.playSound();
		playButton.dataset.playing = "yes";
		playButton.innerHTML = "&#10074;&#10074;";
	}
}

function pause(){
	if (audio.audioCtx.state == "suspended"){
		audio.audioCtx.resume();
	}
	if (playButton.dataset.playing == "yes"){
		audio.pauseSound();
		playButton.dataset.playing = "no";
		playButton.innerHTML = "&#11208;";
	}
}

export {init, showControls, hideControls, update, togglePlay, play, pause,
	controlElement, hideTime, playButton};