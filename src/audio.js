import * as utils from "./utils.js";

let audioElement, audioCtx;
let mediaSourceNode, streamSourceNode, analyserNode, distortionNode, gainNode;
let lowEQNode, midEQNode, highEQNode;

let volume, distortAmount;
let frequencyData, waveformData;
let microphoneActive;

const SOUND_PARAMS = {
	gain					: 0.5,
	analyzerSamples			: 8192,
	sampleRate				: 48000,
	frequency				: 0,
	maxDistortion			: 100,
	maxGain					: 30,
	minGain					: -30,
	eqMargin				: 100,
}

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

function init(filePath){
	createContext();
	activateMedia();
	loadSoundFile(filePath);
}

function createContext(){
	audioCtx = new (window.AudioContext || window.webkitAudioContext);
	audioElement = new Audio();

	analyserNode = audioCtx.createAnalyser();



	//Effect nodes
	distortionNode = audioCtx.createWaveShaper();
	distortionNode.curve = makeDistortionCurve(0);

	gainNode = audioCtx.createGain();
	gainNode.gain.value = SOUND_PARAMS.gain;

	analyserNode.fftSize = SOUND_PARAMS.analyzerSamples;

	frequencyData = new Uint8Array(analyserNode.fftSize / 2);
	waveformData = new Uint8Array(analyserNode.frequencyBinCount);

	//EQ nodes
	SOUND_PARAMS.frequency = analyserNode.fftSize / 2;

	lowEQNode = audioCtx.createBiquadFilter();
	lowEQNode.type = "lowshelf";
	lowEQNode.frequency.setValueAtTime(SOUND_PARAMS.frequency / 3, audioCtx.currentTime);
	lowEQNode.gain.setValueAtTime(0, audioCtx.currentTime);
	
	midEQNode = audioCtx.createBiquadFilter();
	midEQNode.type = "peaking";
	midEQNode.frequency.setValueAtTime(SOUND_PARAMS.frequency / 2, audioCtx.currentTime);
	midEQNode.Q.setValueAtTime(0.5, audioCtx.currentTime);
	midEQNode.gain.setValueAtTime(0, audioCtx.currentTime);
	
	highEQNode = audioCtx.createBiquadFilter();
	highEQNode.type = "highshelf";
	highEQNode.frequency.setValueAtTime(SOUND_PARAMS.frequency / 3 * 2, audioCtx.currentTime);
	highEQNode.gain.setValueAtTime(0, audioCtx.currentTime);
	
}

function hookupNodes(source){
	source.connect(lowEQNode);
	
	//EQ nodes
	lowEQNode.connect(midEQNode);
	midEQNode.connect(highEQNode);
	highEQNode.connect(distortionNode);

	//Effect nodes
	distortionNode.connect(gainNode);
	gainNode.connect(analyserNode);
	analyserNode.connect(audioCtx.destination);
}

function activateMicrophone(){
	pause();
	microphoneActive = true;

	navigator.mediaDevices.getUserMedia({audio: true, video: false})
		.then(function(stream){
			disconnectSourceNodes();
			window.streamReference = stream;
			streamSourceNode = audioCtx.createMediaStreamSource(stream);
			hookupNodes(streamSourceNode);
		})
		.catch(function(err){
			console.log('Error initializing user media stream: ' + err)
		});
}

function closeMicrophone(){
	microphoneActive = false;

	if (window.streamReference) {
		for (let track of window.streamReference.getAudioTracks()){
			track.stop();
		}
	
		window.streamReference = null;
	}
}

function activateMedia(){
	closeMicrophone();

	disconnectSourceNodes();
	if (mediaSourceNode == undefined){
		mediaSourceNode = audioCtx.createMediaElementSource(audioElement);
	}
	hookupNodes(mediaSourceNode);
}

function disconnectSourceNodes(){
	if (mediaSourceNode != undefined){
		mediaSourceNode.disconnect();
	}
	if (streamSourceNode != undefined){
		streamSourceNode.disconnect();
	}
}

function loadSoundFile(path){
	if (microphoneActive){
		activateMedia()
	}
	audioElement.src = path;
}

function play(){
	if (microphoneActive){
		activateMedia();
	}
	audioElement.play();
}

function pause(){
	audioElement.pause();
}

function setVolume(vol){
	volume = Number(vol);
	gainNode.gain.value = volume;
}

function mute(){
	if (gainNode.gain.value > 0){
		gainNode.gain.value = 0;
	}else{
		gainNode.gain.value = volume;
	}
}

function getFrequencyData(){
	analyserNode.getByteFrequencyData(frequencyData);
	return frequencyData
}

function getWaveformData(){
	analyserNode.getByteTimeDomainData(waveformData);
	return waveformData;
}

function getTime(){
	return audioElement.currentTime;
}

function setTime(time){
	audioElement.currentTime = time;
}

function getDuration(){
	return audioElement.duration;
}

function setDistortionAmount(amount = 0){
	distortAmount = amount;
	distortionNode.curve = makeDistortionCurve(amount);

	if (distortAmount == 0){
		//If 0, disable
		distortionNode.curve = undefined;
	}
}

function makeDistortionCurve(amount = 0) {
	let curve = new Float32Array(SOUND_PARAMS.sampleRate);
	let deg = Math.PI / 180;
	for (let i = 0 ; i < SOUND_PARAMS.sampleRate; ++i ) {
	  	let x = i * 2 / SOUND_PARAMS.sampleRate - 1;
	 	curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
	}
	return curve;
}

function resetEqualizer(){
	lowEQNode.type = "lowshelf";
	lowEQNode.frequency.setValueAtTime(SOUND_PARAMS.frequency / 3, audioCtx.currentTime);
	lowEQNode.gain.setValueAtTime(0, audioCtx.currentTime);
	
	midEQNode.type = "peaking";
	midEQNode.frequency.setValueAtTime(SOUND_PARAMS.frequency / 2, audioCtx.currentTime);
	midEQNode.Q.setValueAtTime(0.5, audioCtx.currentTime);
	midEQNode.gain.setValueAtTime(0, audioCtx.currentTime);
	
	highEQNode.type = "highshelf";
	highEQNode.frequency.setValueAtTime(SOUND_PARAMS.frequency / 3 * 2, audioCtx.currentTime);
	highEQNode.gain.setValueAtTime(0, audioCtx.currentTime);
}

export {init, loadSoundFile, play, pause, setVolume, getFrequencyData, getWaveformData, mute, activateMicrophone, getTime, setTime, getDuration,
	setDistortionAmount, resetEqualizer, 
	 audioElement, analyserNode, audioCtx, microphoneActive, lowEQNode , midEQNode, highEQNode, SOUND_PARAMS, SPECTRUM_SECTIONS}