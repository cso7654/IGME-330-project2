import * as canvas from "./canvas.js";
import * as audio from "./audio.js";
import * as utils from "./utils.js";
import * as main from "./main.js";

let controlElement, playButton, volumeIndicator, volumeSlider, fullscreenButton, menuButton, closeMenuButton, menuSection, barSpeedSlider, trackSelect,
	timelineSlider, distortionSlider, equalizerSection, equalizerCanvas, eqCtx, equalizerButton, closeEqualizerButton, resetEqualizerButton;
let leftX, leftY, midY, rightX, rightY;
let mouseDown = false, prevMousePos;
let hideTime = 120, timeShown = 0;

function init(){
	controlElement = document.querySelector("#controls");
	menuSection = document.querySelector("section#menu");

	equalizerSection = document.querySelector("section#equalizer");
	equalizerCanvas = document.querySelector("canvas#equalizerCanvas");
	equalizerCanvas.width = screen.width;
	equalizerCanvas.height = screen.height;
	eqCtx = equalizerCanvas.getContext("2d");
	
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

		equalizerButton = document.querySelector("#equalizerButton");
		equalizerButton.addEventListener("click", function(e){
			toggleEqualizer();
		});

		closeEqualizerButton = document.querySelector("#closeEqualizerButton");
		closeEqualizerButton.addEventListener("click", function(e){
			closeEqualizer();
		});

		resetEqualizerButton = document.querySelector("#resetEqualizerButton");
		resetEqualizerButton.addEventListener("click", function(e){
			audio.resetEqualizer();
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

		distortionSlider = document.querySelector("#distortionSlider");
		distortionSlider.addEventListener("input", function(e){
			audio.setDistortionAmount(e.target.value * audio.SOUND_PARAMS.maxDistortion);
		});
		distortionSlider.dispatchEvent(new Event("input"));
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

	//Equalizer canvas mouse controls
	function initEqualizer(){
		let downEvent = function(e){
			mouseDown = true;
			prevMousePos = utils.getMousePos(equalizerCanvas, e);
			if (equalizer.dataset.hidden == "false"){
				processEQMouse(e);
			}
		};
		equalizerCanvas.addEventListener("mousedown", downEvent);
		equalizerCanvas.addEventListener("touchstart", downEvent);
		
		let moveEvent = function(e){
			if (equalizer.dataset.hidden == "false" && mouseDown){
				processEQMouse(e);
			}
		};
		equalizerCanvas.addEventListener("mousemove", moveEvent);
		equalizerCanvas.addEventListener("touchmove", moveEvent);

		equalizerCanvas.addEventListener("mouseup", function(e){
			mouseDown = false;
		});
		equalizerCanvas.addEventListener("mouseout", function(e){
			mouseDown = false;
		});
		equalizerCanvas.addEventListener("touchend", function(e){
			mouseDown = false;
		});		
		equalizerCanvas.addEventListener("touchcancel", function(e){
			mouseDown = false;
		});
	}
	initEqualizer();


}

function processEQMouse(e){
	let mousePos = utils.getMousePos(equalizerCanvas, e);
	let difference = {x: mousePos.x - prevMousePos.x, y: mousePos.y - prevMousePos.y};
	prevMousePos = mousePos;

	//Check if mouse is vertically within the equalizer box
	if (mousePos.x < leftX){
		//Mouse is in low EQ range
		let futureFrequency = audio.lowEQNode.frequency.value + ((difference.x / equalizerCanvas.width) * audio.SOUND_PARAMS.frequency);
		if(futureFrequency < audio.SOUND_PARAMS.frequency - (audio.SOUND_PARAMS.eqMargin) && futureFrequency > (audio.SOUND_PARAMS.eqMargin)){
			audio.lowEQNode.frequency.setValueAtTime(futureFrequency, audio.audioCtx.currentTime);
			//If the new frequency is higher than the frequency of the high filter, move it too
			if (futureFrequency > audio.highEQNode.frequency.value){
				audio.highEQNode.frequency.setValueAtTime(futureFrequency, audio.audioCtx.currentTime);
			}
		}

		let futureGain = audio.lowEQNode.gain.value + ((-difference.y / main.DRAW_PARAMS.eqHeight) * (audio.SOUND_PARAMS.maxGain - audio.SOUND_PARAMS.minGain));
		futureGain = Math.max(audio.SOUND_PARAMS.minGain, Math.min(audio.SOUND_PARAMS.maxGain, futureGain));
		audio.lowEQNode.gain.setValueAtTime(futureGain, audio.audioCtx.currentTime);
	}else if (mousePos.x > rightX){
		//Mouse is in high EQ range
		let futureFrequency = audio.highEQNode.frequency.value + ((difference.x / equalizerCanvas.width) * audio.SOUND_PARAMS.frequency);
		if(futureFrequency < audio.SOUND_PARAMS.frequency - (audio.SOUND_PARAMS.eqMargin) && futureFrequency > (audio.SOUND_PARAMS.eqMargin)){
			audio.highEQNode.frequency.setValueAtTime(futureFrequency, audio.audioCtx.currentTime);
			//If the new frequency is lower than the frequency of the low filter, move it too
			if (futureFrequency < audio.lowEQNode.frequency.value){
				audio.lowEQNode.frequency.setValueAtTime(futureFrequency, audio.audioCtx.currentTime);
			}
		}

		let futureGain = audio.highEQNode.gain.value + ((-difference.y / main.DRAW_PARAMS.eqHeight) * (audio.SOUND_PARAMS.maxGain - audio.SOUND_PARAMS.minGain));
		futureGain = Math.max(audio.SOUND_PARAMS.minGain, Math.min(audio.SOUND_PARAMS.maxGain, futureGain));
		audio.highEQNode.gain.setValueAtTime(futureGain, audio.audioCtx.currentTime);
	}else{
		//Mouse is in mid EQ range
		let futureFrequency = audio.midEQNode.frequency.value + ((difference.x / equalizerCanvas.width) * audio.SOUND_PARAMS.frequency);
		if(futureFrequency < audio.SOUND_PARAMS.frequency - (audio.SOUND_PARAMS.eqMargin) && futureFrequency > (audio.SOUND_PARAMS.eqMargin)){
			let frequencyDiff = futureFrequency - audio.midEQNode.frequency.value;
			audio.midEQNode.frequency.setValueAtTime(futureFrequency, audio.audioCtx.currentTime);
			//Move both the high and low frequencies with the mid
			if (audio.highEQNode.frequency.value + frequencyDiff < audio.SOUND_PARAMS.frequency - (audio.SOUND_PARAMS.eqMargin)){
				audio.highEQNode.frequency.setValueAtTime(audio.highEQNode.frequency.value + frequencyDiff, audio.audioCtx.currentTime);
			}
			if (audio.lowEQNode.frequency.value + frequencyDiff > audio.SOUND_PARAMS.eqMargin){
				audio.lowEQNode.frequency.setValueAtTime(audio.lowEQNode.frequency.value + frequencyDiff, audio.audioCtx.currentTime);
			}
		}

		let futureGain = audio.midEQNode.gain.value + ((-difference.y / main.DRAW_PARAMS.eqHeight) * (audio.SOUND_PARAMS.maxGain - audio.SOUND_PARAMS.minGain));
		futureGain = Math.max(audio.SOUND_PARAMS.minGain, Math.min(audio.SOUND_PARAMS.maxGain, futureGain));
		audio.midEQNode.gain.setValueAtTime(futureGain, audio.audioCtx.currentTime);
	}

	let midRange = audio.highEQNode.frequency.value - audio.lowEQNode.frequency.value;
	audio.midEQNode.frequency.setValueAtTime(audio.lowEQNode.frequency.value + midRange / 2, audio.audioCtx.currentTime)
	audio.midEQNode.Q.setValueAtTime(1 / (midRange / audio.SOUND_PARAMS.frequency), audio.audioCtx.currentTime);

	updateEqualizerCoordinates();
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
		//Escape: Toggle Menu, or close equalizer if it is open
		case "Escape":
			if (equalizer.dataset.hidden == "false"){
				closeEqualizer();
			}else{
				toggleMenu();
			}
			break;
		//E: Toggle equalizer
		case "e": case "E":
			toggleEqualizer();
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

function toggleEqualizer(){
	if (equalizer.dataset.hidden == "true"){
		openEqualizer();
	}else{
		closeEqualizer();
	}
}
function openEqualizer(){
	equalizer.dataset.hidden = "false";
}
function closeEqualizer(){
	equalizer.dataset.hidden = "true";
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

	//Hide controls if menu or equalizer is open
	if (menuSection.dataset.hidden == "false" || equalizerSection.dataset.hidden == "false"){
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

	//Update values for equalizer lines
	updateEqualizerCoordinates();

	//Draw the equalizer canvas
	drawEqualizer();
}

function updateEqualizerCoordinates(){
	//Calculate where low and mid meet
	leftX = (audio.lowEQNode.frequency.value / (audio.SOUND_PARAMS.frequency)) * equalizerCanvas.width;
	//Calculate y value between low and mid
	leftY = (audio.lowEQNode.gain.value / audio.SOUND_PARAMS.maxGain) * (-main.DRAW_PARAMS.eqHeight / 2) + (equalizerCanvas.height / 2);
	//Calculate middle y value
	midY = (audio.midEQNode.gain.value / audio.SOUND_PARAMS.maxGain) * (-main.DRAW_PARAMS.eqHeight / 2) + (equalizerCanvas.height / 2)
	//Calculate where mid and high meet
	rightX = (audio.highEQNode.frequency.value / (audio.SOUND_PARAMS.frequency)) * equalizerCanvas.width;
	//Calculate y value between mid and high
	rightY = (audio.highEQNode.gain.value / audio.SOUND_PARAMS.maxGain) * (-main.DRAW_PARAMS.eqHeight / 2) + (equalizerCanvas.height / 2);
}

function drawEqualizer(){
	eqCtx.clearRect(0, 0, equalizerCanvas.width, equalizerCanvas.height);
	// eqCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
	// eqCtx.fillRect(0, 0, equalizerCanvas.width, equalizerCanvas.height);
	eqCtx.fillStyle = "black";
	eqCtx.fillRect(0, equalizerCanvas.height / 2 - main.DRAW_PARAMS.eqHeight / 2, equalizerCanvas.width, main.DRAW_PARAMS.eqHeight);

	eqCtx.lineWidth = main.DRAW_PARAMS.eqThickness;

	//console.log(utils.calcDBFromAmplitude(0.1));
	//audio.lowEQNode.gain.setValueAtTime(0, audio.audioCtx.currentTime);

	eqCtx.lineCap = "round";

	//Connecting lines
	eqCtx.beginPath();
	eqCtx.moveTo(leftX, leftY);
	eqCtx.strokeStyle = main.DRAW_PARAMS.eqColor;
	eqCtx.lineTo(leftX, midY);
	eqCtx.stroke();
	eqCtx.beginPath();
	eqCtx.moveTo(rightX, midY);
	eqCtx.strokeStyle = main.DRAW_PARAMS.eqColor;
	eqCtx.lineTo(rightX, rightY);
	eqCtx.stroke();

	//Bass
	eqCtx.beginPath();
	eqCtx.strokeStyle = main.DRAW_PARAMS.eqBassColor;
	eqCtx.moveTo(0, leftY);
	eqCtx.lineTo(leftX, leftY);
	eqCtx.stroke();

	//Mid
	eqCtx.beginPath();
	eqCtx.moveTo(leftX, midY);
	eqCtx.strokeStyle = main.DRAW_PARAMS.eqMidColor;
	eqCtx.lineTo(rightX, midY);
	eqCtx.stroke();

	//High
	eqCtx.beginPath();
	eqCtx.moveTo(rightX, rightY);
	eqCtx.strokeStyle = main.DRAW_PARAMS.eqHighColor;
	eqCtx.lineTo(equalizerCanvas.width, rightY);
	eqCtx.stroke();
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