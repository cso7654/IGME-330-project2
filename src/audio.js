let audioElement, audioCtx;
let mediaSourceNode, streamSourceNode, analyserNode, gainNode, volume;

let frequencyData, waveformData;

let microphoneActive;

const SOUND_PARAMS = {
	gain					: 0.5,
	analyzerSamples			: 8192,
	sampleRate				: 48000,
}

function init(filePath){
	createContext();
	activateMedia();
	//hookupNodes();
	loadSoundFile(filePath);
}

function createContext(){
	audioCtx = new (window.AudioContext || window.webkitAudioContext);
	audioElement = new Audio();

	analyserNode = audioCtx.createAnalyser();
	gainNode = audioCtx.createGain();
	gainNode.gain.value = SOUND_PARAMS.gain;

	analyserNode.fftSize = SOUND_PARAMS.analyzerSamples;

	frequencyData = new Uint8Array(analyserNode.fftSize / 2);
	waveformData = new Uint8Array(analyserNode.frequencyBinCount);
}

function hookupNodes(source){
	source.connect(gainNode);
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

export {init, loadSoundFile, play, pause, setVolume, getFrequencyData, getWaveformData, mute, activateMicrophone, getTime, setTime, getDuration, 
	 audioElement, analyserNode, audioCtx, microphoneActive, SOUND_PARAMS}