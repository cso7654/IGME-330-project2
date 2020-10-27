import * as canvas from "./canvas.js";
import * as audio from "./audio.js";
import * as utils from "./utils.js";
import * as main from "./main.js";

let controlElement, playButton, volumeIndicator, volumeSlider, fullscreenButton, menuButton, closeMenuButton, menuSection, barSpeedSlider, trackSelect,
	timelineSlider;
let hideTime = 120, timeShown = 0;

function init(){
	controlElement = document.querySelector("#controls");
	menuSection = document.querySelector("section#menu");
	
	//Mouse events
	function initMouseEvents(){
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
	}
	initMouseEvents();

	//Buttons
	function initButtons(){
		playButton = document.querySelector("#playButton");
		playButton.addEventListener("click", function(e){
			togglePlay();
		});

		volumeIndicator = document.querySelector("#volumeIndicator");
		volumeIndicator.addEventListener("click", function(e){
			if (volumeIndicator.dataset.muted == "false"){
				volumeIndicator.dataset.muted = "true";
			}else{
				volumeIndicator.dataset.muted = "false";
			}
			audio.mute();
			updateVolumeIndicator();
		});

		fullscreenButton = document.querySelector("#fullscreenButton");
		fullscreenButton.addEventListener("click", function(e){
			utils.toggleFullscreen(document.documentElement);
		});

		menuButton = document.querySelector("#menuButton");
		menuButton.addEventListener("click", function(e){
			toggleMenu();
		});

		closeMenuButton = document.querySelector("#closeMenuButton");
		closeMenuButton.addEventListener("click", function(e){
			closeMenu();
			showControls();
		});
	}
	initButtons();

	//Checkboxes
	function initCheckboxes(){
		//Waveform
		let waveformCB = document.querySelector("#waveformCB");
		waveformCB.onchange = function(e){
			main.DRAW_PARAMS.showWaveform = waveformCB.checked;
		}
		waveformCB.dispatchEvent(new Event("change"));
	
		//Invert
		let invertCB = document.querySelector("#invertCB");
		invertCB.onchange = function(e){
			main.DRAW_PARAMS.invert = invertCB.checked;
		}
		invertCB.dispatchEvent(new Event("change"));
	
		//Emboss
		let embossCB = document.querySelector("#embossCB");
		embossCB.onchange = function(e){
			main.DRAW_PARAMS.emboss = embossCB.checked;
		}
		embossCB.dispatchEvent(new Event("change"));
	}
	initCheckboxes();

	//Sliders
	function initSliders(){
		volumeSlider = document.querySelector("#volumeSlider");
		volumeSlider.addEventListener("input", function(e){
			audio.setVolume(e.target.value);
			volumeIndicator.dataset.muted = "false";
			updateVolumeIndicator();
		});
		volumeSlider.dispatchEvent(new Event("input"));

		barSpeedSlider = document.querySelector("#barSpeedSlider");
		barSpeedSlider.addEventListener("input", function(e){
			main.DRAW_PARAMS.sectionsPerFrame = e.target.value;
		});
		barSpeedSlider.dispatchEvent(new Event("input"));

		timelineSlider = document.querySelector("#timelineSlider");
		timelineSlider.addEventListener("input", function(e){
			audio.setTime(e.target.value * audio.getDuration());
		});
	}
	initSliders();

	//Track select
	trackSelect = document.querySelector("#trackSelect");
	trackSelect.onchange = function(e){
		let val = e.target.value;
		if (val[0] == "@"){
			switch(val){
				case "@mic":
					audio.activateMicrophone();
					break;
			}
		}else{
			audio.loadSoundFile(e.target.value);
		}

		if (playButton.dataset.playing = "yes"){
			playButton.dispatchEvent(new Event("click"));
		}
	}

	//Loop through all buttons and inputs and add event listeners to blur() any of them so focus does not disturb key events
	for (let el of document.querySelectorAll("button")){
		addBlurEvents(el);
	}
	for (let el of document.querySelectorAll("input")){
		addBlurEvents(el);
	}

	//Keyboard controls
	window.addEventListener("keydown", function(e){
		keyDown(e);
	});
}


function addBlurEvents(el){
	el.addEventListener("click", function(e){
		el.blur();
	});
	el.addEventListener("input", function(e){
		el.blur();
	});
	el.addEventListener("change", function(e){
		el.blur();
	});
}

function keyDown(e){
	switch (e.key){
		//Spacebar:	Play/Pause
		case " ":
			togglePlay();
			break;
		//Escape: Toggle Menu
		case "Escape":
			toggleMenu();
			break;
	}
}

function toggleMenu(){
	if(menuSection.dataset.hidden == "true"){
		openMenu();
	}else{
		closeMenu();
	}
}
function openMenu(){
	menuSection.dataset.hidden = "false";

}
function closeMenu(){
	menuSection.dataset.hidden = "true";
}

function update(){
	//Timed close of controls
	if (timeShown > 0){
		timeShown--;
	}else if (timeShown == -1){
		showControls();
		timeShown = -1;
	}else{
		hideControls();
	}

	//Hide controls if menu is open
	if (menuSection.dataset.hidden == "false"){
		hideControls();
	}

	//Disable play/pause if microphone is active
	if (audio.microphoneActive){
		playButton.hidden = true;
	}else{
		playButton.hidden = false;
	}

	//Update timeline slider
	timelineSlider.value = audio.getTime() / audio.getDuration();
}

function updateVolumeIndicator(){
	if (volumeIndicator.dataset.muted == "true" || volumeSlider.value == 0){
		volumeIndicator.innerHTML = "<i class='fas fa-volume-off'></i>";
	}else if (volumeSlider.value > volumeSlider.max / 2){
		volumeIndicator.innerHTML = "<i class='fas fa-volume-up'></i>";
	}else{
		volumeIndicator.innerHTML = "<i class='fas fa-volume-down'></i>";
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
	if (!audio.microphoneActive){
		if (playButton.dataset.playing == "no"){
			play();
		}else{
			pause();
		}
	}
}

function play(){
	if (!audio.microphoneActive){
		if (audio.audioCtx.state == "suspended"){
			audio.audioCtx.resume();
		}
		if (playButton.dataset.playing == "no"){
			audio.play();
			playButton.dataset.playing = "yes";
			playButton.innerHTML = "<i class='fas fa-pause'></i>";
		}
	}
}

function pause(){
	if (!audio.microphoneActive){
		if (audio.audioCtx.state == "suspended"){
			audio.audioCtx.resume();
		}
		if (playButton.dataset.playing == "yes"){
			audio.pause();
			playButton.dataset.playing = "no";
			playButton.innerHTML = "<i class='fas fa-play'></i>";
		}
	}
}

export {init, showControls, hideControls, update, togglePlay, play, pause, openMenu, closeMenu, toggleMenu,
	controlElement, hideTime, playButton};