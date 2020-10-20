let audioElement, audioCtx;
let sourceNode, analyserNode, gainNode, volume;

let frequencyData, waveformData;

const SOUND_PARAMS = {
	gain					: 0.5,
	analyzerSamples			: 8192,
	sampleRate				: 48000,
}

function init(filePath){
	audioCtx = new (window.AudioContext || window.webkitAudioContext);
	audioElement = new Audio();

	sourceNode = audioCtx.createMediaElementSource(audioElement);

	analyserNode = audioCtx.createAnalyser();
	gainNode = audioCtx.createGain();
	gainNode.gain.value = SOUND_PARAMS.gain;

	analyserNode.fftSize = SOUND_PARAMS.analyzerSamples;

	sourceNode.connect(gainNode);
	gainNode.connect(analyserNode);
	analyserNode.connect(audioCtx.destination);

	frequencyData = new Uint8Array(analyserNode.fftSize / 2);
	waveformData = new Uint8Array(analyserNode.frequencyBinCount);

	loadSoundFile(filePath);
}

function loadSoundFile(path){
	audioElement.src = path;
}

function playSound(){
	audioElement.play();
}

function pauseSound(){
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

export {init, loadSoundFile, playSound, pauseSound, setVolume, getFrequencyData, getWaveformData, mute,
	 analyserNode, audioCtx, SOUND_PARAMS}