import * as utils from './utils.js';

let ctx, canvas, canvasWidth, canvasHeight, analyserNode;
let trailCanvas, trailCtx;

let backgroundGradient, sectionSpacing;

function setupCanvas(canvasElement, analyserNodeRef){
	canvas = canvasElement;
	// create drawing context
	canvas.width = screen.width;
	canvas.height = screen.height;
	ctx = canvas.getContext("2d");
	canvasWidth = canvas.width;
	canvasHeight = canvas.height;
	// keep a reference to the analyser node
	analyserNode = analyserNodeRef;

	//Background gradient
	backgroundGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
	backgroundGradient.addColorStop(0, "black");
	backgroundGradient.addColorStop(0.5, "#444");
	backgroundGradient.addColorStop(1, "black");

	//Create canvas for the trails of the levels to simplify modification
	trailCanvas = document.createElement("canvas");
	trailCanvas.width = canvasWidth;
	trailCanvas.height = canvasHeight;
	trailCanvas.hidden = true;
	document.body.append(trailCanvas);
	trailCtx = trailCanvas.getContext("2d");
}

function draw(drawParams = {}, spectrumSections = {}, waveData){
	//Update section spacing
	sectionSpacing = canvasWidth / (Object.keys(spectrumSections).length + 1);

	//Draw background
	ctx.save();
	ctx.fillStyle = backgroundGradient;
	ctx.globalAlpha = 1;
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);
	ctx.restore();

	//Update trails to push them up as time goes on
	updateTrails(drawParams, spectrumSections);
	//Draw trail context on top of canvas
	ctx.save();
	ctx.globalAlpha = drawParams.trailAlpha;
	ctx.drawImage(trailCanvas, 0, 0);
	ctx.restore();

	//Add glowing base nodes at the base of the trails that pulsate with their sections' volumes
	drawTrailBases(drawParams, spectrumSections);

	//Draw the oscilloscope/waveform in the center of the screen
	if (drawParams.showWaveform){
		drawWaveform(drawParams, waveData);
	}
		
	applyFilters(ctx, drawParams);
}

function updateTrails(drawParams = {}, spectrumSections = {}){
	trailCtx.save();

	//copy and shift data upwards
	let data = trailCtx.getImageData(0, 0, canvasWidth, canvasHeight);
	//Clear canvas underneath to make sure nothing is forgotten when shifting
	trailCtx.clearRect(0, 0, canvasWidth, canvasHeight);
	trailCtx.putImageData(data, 0, -drawParams.trailSegmentSize * drawParams.sectionsPerFrame);

	//Draw new trail segments
	let index = 0;
	for (let section of Object.values(spectrumSections)){
		drawTrail(trailCtx, drawParams, section, sectionSpacing * (1 + index));
		index++;
	}

	trailCtx.restore();
}

function drawTrail(trailCtx, drawParams = {}, section, x){
	trailCtx.save();

	trailCtx.shadowBlur = drawParams.trailSegmentBlur;
	trailCtx.shadowColor = section.color;
	trailCtx.fillStyle = section.color;
	let topWidth = drawParams.minTrailWidth + ((drawParams.maxTrailWidth - drawParams.minTrailWidth) * (section.prevValue / 255));
	let bottomWidth = drawParams.minTrailWidth + ((drawParams.maxTrailWidth - drawParams.minTrailWidth) * (section.value / 255));
	trailCtx.beginPath();
	trailCtx.moveTo(x - topWidth / 2, canvasHeight - drawParams.trailStart - (drawParams.trailSegmentSize * drawParams.sectionsPerFrame));
	trailCtx.lineTo(x + topWidth / 2, canvasHeight - drawParams.trailStart - (drawParams.trailSegmentSize * drawParams.sectionsPerFrame));
	trailCtx.lineTo(x + bottomWidth / 2, canvasHeight - drawParams.trailStart);
	trailCtx.lineTo(x - bottomWidth / 2, canvasHeight - drawParams.trailStart);
	trailCtx.closePath();
	trailCtx.fill();

	trailCtx.restore();
}

function drawTrailBases(drawParams = {}, spectrumSections = {}){

	let index = 0;
	for (let section of Object.values(spectrumSections)){
		ctx.save();

		let x = sectionSpacing * (1 + index);
		let y = canvasHeight - drawParams.trailStart;
		let trailWidth = drawParams.minTrailWidth + ((drawParams.maxTrailWidth - drawParams.minTrailWidth) * (section.value / 255));
		//trailWidth = 1;

		//Draw a line with a thick shadow at the base of the trail to obscure the harsh lines
		// ctx.shadowColor = "white";
		// ctx.shadowBlur = 20;
		// ctx.beginPath();
		// ctx.lineCap = "round";		
		// ctx.strokeStyle = "white";
		// ctx.lineWidth = 1;
		// ctx.moveTo(x - trailWidth / 2, y);
		// ctx.lineTo(x + trailWidth / 2, y);
		// //ctx.closePath();
		// ctx.stroke();

		//Draw a "light" that the trails appear to emerge out of and pulse with the activity of the channel
		//drawTrail(trailCtx, drawParams, section, sectionSpacing * (1 + index));
		//let innerRadius = () / 2;
		let innerRadius = drawParams.minTrailWidth;
		innerRadius = trailWidth / 2;
		let outerRadius = (drawParams.minTrailWidth + ((drawParams.maxTrailWidth - drawParams.minTrailWidth) * 
			((section.value + 128) / 255))) / 2;

		let verticalScale = 0.1;

		let gradient = ctx.createRadialGradient(x, y * (1 / verticalScale), innerRadius,
												x, y * (1 / verticalScale), outerRadius);

												//console.log(outerRadius);
		gradient.addColorStop(0, "white");
		gradient.addColorStop(1, section.color + "00");
		ctx.shadowColor = "#0000000";
		ctx.shadowBlur = 0;

		ctx.fillStyle = gradient;
		ctx.setTransform(1, 0, 0, verticalScale, 0, 0);
		ctx.beginPath();
		//ctx.arc(x, y, outerRadius, 0, 0, Math.PI * 2);
		ctx.ellipse(x, y * (1 / verticalScale), outerRadius, outerRadius, 0, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fill();

		index++;
		ctx.restore();
	}

}

function drawWaveform(drawParams = {}, waveData){
	ctx.save();

	let segmentWidth = canvasWidth / waveData.length;
	let vertTranslate = drawParams.waveformHeight;

	ctx.beginPath();
	ctx.strokeStyle = drawParams.waveformColor;
	ctx.lineWidth = drawParams.waveformThickness;
	ctx.shadowColor = drawParams.waveformColor;
	ctx.shadowBlur = drawParams.waveformBlur;
	ctx.lineJoin = "round";
	ctx.moveTo(0, drawParams.waveformY);
	//plot line
	for (let i = 0; i < waveData.length; i++){
		ctx.lineTo(i * segmentWidth, drawParams.waveformY + (waveData[i] / 128) * drawParams.waveformHeight - vertTranslate);
	}
	ctx.stroke();

	ctx.restore();
}

function applyFilters(ctx, params){
	let imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
	let data = imgData.data;
	let length = data.length;
	let width = imgData.width;

	if (params.emboss){
		for (let i = 0; i < length; i++){
			//Don't emboss alpha channel
			if (i % 4 != 3){
				data[i] = 127 + 2 * data[i] - data[i + 4] - data[i + width * 4];
			}			
		}
	}

	// B) Iterate through each pixel, stepping 4 elements at a time (which is the RGBA for 1 pixel)
	for (let i = 0; i < length; i += 4){
		// C) randomly change every 20th pixel to red
		// if (params.showNoise && Math.random() < 0.05){
		// 	// data[i] is the red channel
		// 	// data[i+1] is the green channel
		// 	// data[i+2] is the blue channel
		// 	// data[i+3] is the alpha channel
		// 	// zero out the red and green and blue channels
		// 	// make the red channel 100% red
		// 	data[i + 1] = data[i + 2] = 0;
		// 	data[i] = 255;
		// }

		//Invert colors
		if (params.invert){
			data[i] = 255 - data[i];
			data[i + 1] = 255 - data[i + 1];
			data[i + 2] = 255 - data[i + 2];
			//data[i + 3] = 255 - data[i + 3];
		}
	}
	
	// D) copy image data back to canvas
	ctx.putImageData(imgData, 0, 0);
}

export {setupCanvas, draw, canvas, canvasWidth, canvasHeight};