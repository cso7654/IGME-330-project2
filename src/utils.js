// Why are the all of these ES6 Arrow functions instead of regular JS functions?
// No particular reason, actually, just that it's good for you to get used to this syntax
// For Project 2 - any code added here MUST also use arrow function syntax

const makeColor = (red, green, blue, alpha = 1) => {
	return `rgba(${red},${green},${blue},${alpha})`;
  };
  
  const getRandom = (min, max) => {
	return Math.random() * (max - min) + min;
  };
  
  const getRandomColor = () => {
	  const floor = 35; // so that colors are not too bright or too dark 
	const getByte = () => getRandom(floor,255-floor);
	return `rgba(${getByte()},${getByte()},${getByte()},1)`;
  };
  
  const getLinearGradient = (ctx,startX,startY,endX,endY,colorStops) => {
	let lg = ctx.createLinearGradient(startX,startY,endX,endY);
	for(let stop of colorStops){
	  lg.addColorStop(stop.percent,stop.color);
	}
	return lg;
  };
  
  
const toggleFullscreen = (element) => {
	if (document.fullscreenElement == element){
		//If the fullscreen element is the provided element, exit fullscreen
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.mozCancelFullScreen) { /* Firefox */
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
			document.webkitExitFullscreen();
		} else if (document.msExitFullscreen) { /* IE/Edge */
			document.msExitFullscreen();
		}
	}else{
		//If the fullscreen is NOT the provided element, enter fullscreen
		if (element.requestFullscreen) {
			element.requestFullscreen();
		} else if (element.mozRequestFullscreen) {
			element.mozRequestFullscreen();
		} else if (element.mozRequestFullScreen) { // camel-cased 'S' was changed to 's' in spec
			element.mozRequestFullScreen();
		} else if (element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen();
		}
	}
  };

function getSampleValue(frequency, maxFrequency, maxSamples){
	let percent = frequency / maxFrequency;
	return Math.round(percent * maxSamples);
}

function calcSectionValues(audioData, soundParams = {}, spectrumSections = {}){
	let previousSamples = 0;
	for (let section of Object.values( spectrumSections)){
		section.prevValue = section.value;
		let samples = getSampleValue(section.frequency, soundParams.sampleRate, soundParams.analyzerSamples / 2);
		for (let i = previousSamples; i < samples; i++){
			section.value += audioData[i];
		}
		section.value /= samples - previousSamples;
		previousSamples = samples + 1;
	}
}

function calcDBFromAmplitude(amplitude){
	return 20 * Math.log10(Math.pow(amplitude, 4) * 60);
}

function getMousePos(canvas, e) {
	let rect = canvas.getBoundingClientRect();
  
	return {
		x: (e.clientX - rect.left) * (canvas.width / rect.width),
		y: (e.clientY - rect.top) * (canvas.height / rect.height)
	}
}

export {makeColor, getRandomColor, getLinearGradient, toggleFullscreen, getSampleValue, calcSectionValues, calcDBFromAmplitude, getMousePos};