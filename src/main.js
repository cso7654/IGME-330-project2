import * as audio from "./audio.js";
import * as utils from "./utils.js";
import * as canvas from "./canvas.js";
import * as controls from "./controls.js";

// 1 - here we are faking an enumeration
const DEFAULTS = Object.freeze({
	//sound1  :  "/media/mozart-symphony40-1.mp3"
	sound1: "./media/Mozart Concerto No21.mp3"
});

const DRAW_PARAMS = {
	showWaveform		: true,
	invert				: false,
	emboss				: false,
	trailSegmentSize	: 10,
	sectionsPerFrame	: 1,
	maxTrailWidth		: 100,
	minTrailWidth		: 1,
	trailStart			: 50,
	trailAlpha			: 0.7,
	trailSegmentBlur	: 10,
	waveformThickness	: 3,
	waveformColor		: "white",
	waveformBlur		: 10,
	waveformHeight		: 250,
	waveformY			: 100
};

const SPECTRUM_SECTIONS = {
	//Values in hertz from https://www.teachmeaudio.com/mixing/techniques/audio-spectrum
	subBass					: {frequency	: 60, 		color: "#ba19ff",		value: 0,	prevValue: 0},
	bass					: {frequency	: 250, 		color: "#9f19ff",		value: 0,	prevValue: 0},
	lowMid					: {frequency	: 500, 		color: "#8c19ff",		value: 0,	prevValue: 0},
	mid						: {frequency	: 2000, 	color: "#7119ff",		value: 0,	prevValue: 0},
	highMid					: {frequency	: 4000, 	color: "#5e19ff",		value: 0,	prevValue: 0},
	treble					: {frequency	: 6000, 	color: "#4719ff",		value: 0,	prevValue: 0},
	brilliance 				: {frequency	: 48000, 	color: "#2419ff",		value: 0,	prevValue: 0}
}

window.onload = function(e){
	init();
}

function init(){
	audio.init(DEFAULTS.sound1);
	audio.SOUND_PARAMS.sampleRate = audio.audioCtx.sampleRate;
	//Update brilliance frequency stop to be the maximum frequency
	SPECTRUM_SECTIONS.brilliance.frequemcy = audio.SOUND_PARAMS.sampleRate;
	
	let canvasElement = document.querySelector("canvas"); // hookup <canvas> element
	setupUI(canvasElement);
	canvas.setupCanvas(canvasElement, audio.analyserNode);
	//Modify draw params to match canvas size
	DRAW_PARAMS.minTrailWidth = canvas.canvasWidth / 8 / 75;
	DRAW_PARAMS.maxTrailWidth = canvas.canvasWidth / 8;
	DRAW_PARAMS.trailSegmentSize = canvas.canvasHeight / 500;
	DRAW_PARAMS.sectionsPerFrame = 5;
	DRAW_PARAMS.waveformY = canvas.canvasHeight / 2;
	DRAW_PARAMS.waveformHeight = canvas.canvasHeight / 3;
	DRAW_PARAMS.waveformThickness = canvas.canvasWidth / audio.SOUND_PARAMS.analyzerSamples * 4;
	//Set up the playback controls
	controls.init();
	loop();

	//audio.activateMicrophone();
}

function setupUI(canvasElement){

	//Set up drag and drop
	initDragAndDrop();

}

function initDragAndDrop(){
	document.documentElement.addEventListener("dragover", function(e){
		e.preventDefault();
	})
	document.documentElement.addEventListener("drop", function(e){
		e.preventDefault();

		let blob = window.URL || window.webkitURL;
		let file = e.dataTransfer.files[0];
		let url = blob.createObjectURL(file);
		audio.loadSoundFile(url);
		controls.pause();
		controls.play();
	});
}



function loop(){
	requestAnimationFrame(loop);

	utils.calcSectionValues(audio.getFrequencyData(), audio.SOUND_PARAMS, SPECTRUM_SECTIONS);

	//console.log(audio.audioCtx.currentTime);

	//console.log(sectionValues);
	canvas.draw(DRAW_PARAMS, SPECTRUM_SECTIONS, audio.getWaveformData());
		
	controls.update();
}

function enterFullscreen() {
	document.requestFullscreen();
}
  
function exitFullscreen() {
	document.exitFullscreen();
}

export {init, enterFullscreen, exitFullscreen, DRAW_PARAMS, SPECTRUM_SECTIONS};