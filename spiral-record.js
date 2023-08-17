const canvas = document.getElementById('spiralCanvas');
const renderer = new THREE.WebGLRenderer({ canvas });

const compositeCanvas = document.getElementById("compositeCanvas");
const compositeCanvasContext = compositeCanvas.getContext("2d");

const hypnoText = document.getElementById("hypnoText-container");

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const scene = new THREE.Scene();
const plane = new THREE.PlaneBufferGeometry(2, 2);
const fragmentShader = `	
    uniform vec2 iResolution;
    uniform float iTime;

    uniform float GLOBAL_SPEED;
	uniform float GLOBAL_SCALE;

    uniform float FREQ;
	uniform float EXP;
    uniform float BASE_SPEED;
	uniform int DIR_FLIPS;
	uniform float CONCENTRIC;
	uniform float CONCENTRIC_SPEED;

    uniform float NOISE_FREQ;
    uniform float NOISE_SPEED;
    uniform float NOISE_ANG_AMP;
	uniform float NOISE_RAD_AMP;

    uniform float PULSE_FREQ;
    uniform float PULSE_SPEED;
    uniform float PULSE_EXP;
    uniform float PULSE_AMP;
	uniform float PULSE_HUE;
	
	uniform float HUE;
	uniform float SAT;
	uniform float VAL;
	
	uniform float LINE_EXP;
	
	uniform float MOTION_BLUR;
	uniform int SUPERSAMPLING_FACTOR; // Supersampling factor for anti-aliasing (higher = smoother but slower)
	
	uniform int FORCE_LOOP;
	uniform float LOOP_PERIOD;
	uniform float TRANS_TIME;
	uniform float LOOP_FEATHER;
	uniform int LOOP_REVERSE;
	
	float rand(vec2 n) {
        return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }

    float noise(vec2 n) {
        const vec2 d = vec2(0.0, 1.0);
        vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
        return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
    }

    vec2 c2p(vec2 p){
        float angle = atan(p.y, p.x);
        float radius = length(p);
        return vec2(radius, angle);
    }

    vec2 p2c(vec2 polar){
        float x = polar.x * cos(polar.y);
        float y = polar.x * sin(polar.y);
        return vec2(x, y);
    }
	
	// Convert Hue/Sat/Val to RGB
	vec3 hsv2rgb(vec3 c) {
		vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
		vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
		return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
	}
	
	// custom power function, because uniforms break pow() for some god-forsaken reason
    float customPow(float base, float exponent) {
        if (base <= 0.0) {
            return 0.0;
        }
        return exp2(exponent * log2(base));
    }
	
	// Range mapping function
	float remap(float value, float oldMin, float oldMax, float newMin, float newMax) {
	  return newMin + (value - oldMin) * (newMax - newMin) / (oldMax - oldMin);
	}

	// main fragment shader
	vec3 primaryShader( in vec2 fragCoord, in float inTime )
	{
		// zero-centered uv space
		vec2 p_shortNorm = vec2((fragCoord.x / iResolution.x - 0.5) * (iResolution.x / min(iResolution.x, iResolution.y)) * 2.0, (fragCoord.y / iResolution.y - 0.5) * (iResolution.y / min(iResolution.x, iResolution.y)) * 2.0);
		vec2 p = p_shortNorm / GLOBAL_SCALE;
		
		// aspect ratio of screen
		float aspect = max(iResolution.x, iResolution.y) / min(iResolution.x, iResolution.y);
		
		// get polar coordinates
		vec2 polar = c2p(p);
		
		
		
		

		
		
		if (1==1) {
			float timeA = mod(inTime, LOOP_PERIOD*2.0); // normal time
			float timeB = mod(inTime+LOOP_PERIOD, LOOP_PERIOD*2.0); // out of phase time
			
			float transGrad = 1.0 - ((polar.x * GLOBAL_SCALE) / (aspect * 1.4145)); // normalized transition gradient (could be direction, radius, some spiral thing, etc)
			if (LOOP_REVERSE == 1) {transGrad = 1.0 - transGrad;} // reverse direction
			float swapValue = remap(mod(inTime, LOOP_PERIOD), LOOP_PERIOD-TRANS_TIME, LOOP_PERIOD, 0.0, 1.0); // broken-up linear curve over time for actual transition factor
			float swapValue_clamped = clamp(swapValue, 0.0, 1.0); // clamp to actually break up the linear curve
			
			float featherCurve = abs(transGrad - swapValue_clamped) * (1.0 / customPow(LOOP_FEATHER*0.5,2.0));
			featherCurve = clamp(featherCurve, 0.0, 1.0);
			featherCurve = 1.0 - featherCurve;
			featherCurve = customPow(featherCurve, 1.0);
			
			swapValue_clamped -= rand(fragCoord) * (featherCurve * TRANS_TIME * 0.01); // edge feather
			
			float viewA, viewB; // placeholder times so that they can be swapped without issues
			


			
			// swap times past half-way point (necessary for same-direction transitioning)
			if (timeA > LOOP_PERIOD) {
				viewA = timeA;
				viewB = timeB;
			}
			else {
				viewA = timeB;
				viewB = timeA;
			}
			
			// actually swap between times based on transition gradient and swap value
			if (swapValue_clamped < transGrad) {
				inTime = viewA;
			}
			else {
				inTime = viewB;
			}
		}
		
		
		
		
		
		float globalTime = inTime * GLOBAL_SPEED;
		
		
		
		
		
		
		// noise
		vec2 noiseSampleP = p2c(vec2(polar.x, polar.y + globalTime * NOISE_SPEED)); // rotate the uv-space the noise will be sampling from (to rotate the noise)
		vec2 displace = vec2(noise(noiseSampleP * NOISE_FREQ)); // calculate noise
		polar.y += displace.x * NOISE_ANG_AMP; // displace spiral with noise (polar.y affects displacement)
		polar.x += displace.y * NOISE_RAD_AMP; // darken spiral with nosie (polar.x affects brightness)
			
		// Spiral
		polar.y += clamp(tan(polar.x * CONCENTRIC + globalTime * CONCENTRIC_SPEED * CONCENTRIC), -25.0, 25.0); // add concentric circles
		polar.y += customPow(polar.x, EXP) * FREQ + globalTime * BASE_SPEED; // twist the uv space around the origin (basis of the spiral)
		float pulse = sin(polar.x * PULSE_FREQ + globalTime * PULSE_SPEED); // create pulse factor
		polar.y -= customPow(pulse, PULSE_EXP) * PULSE_AMP; // contract/expand based on pulse factor
		polar.y += (atan(p.y,p.x) - pulse*PULSE_AMP) * float(DIR_FLIPS); // cool and weird effect (happy accident)
		float newHue = HUE + pulse * PULSE_HUE; // modulate hue with pulse
		
		// convert spiralized polar coords back to cartesian
		p = p2c(polar);
		
		
		// make line (which will now be a spiral because of the warped coordinates)
		float bright = 1.0 - abs(p.y); // make base linear value
		bright += abs(p.x) * -0.2; // make it look nice
		bright *= 1.8; // make it look nice
		bright *= customPow(clamp(p.x, 0.0, 0.5), 0.5); // cut left half out
		bright = customPow(bright, LINE_EXP); // exponent (sharpness)
		bright = clamp(bright, 0.0, 1.0); // clamp final brightness
		
		vec3 inColor = hsv2rgb(vec3(newHue, SAT*0.5, VAL)); // color of inner line
		vec3 outColor = hsv2rgb(vec3(newHue, SAT, VAL)); // color of glow around line
		vec3 col = mix(outColor, inColor, bright); // interpolate between in/out colors
		col *= bright; // black background

		//col = vec3(featherCurve);

		return col;
	}
	
	// supersampling (for anti-aliasing)
	vec3 superSample( in vec2 fragCoord) {
		
		vec3 result = vec3(0.0);
		
		// calculate shader at subpixels and sum for average color
		for (int x = 0; x < SUPERSAMPLING_FACTOR; x++) {
			for (int y = 0; y < SUPERSAMPLING_FACTOR; y++) {
				vec2 offset = vec2(float(x) / float(SUPERSAMPLING_FACTOR), float(y) / float(SUPERSAMPLING_FACTOR)); // subpixel offset
				float timeOffset = iTime + rand(offset) * MOTION_BLUR * 0.05; // time offset (for motion blur)
				result += primaryShader(fragCoord + offset, timeOffset) / float(SUPERSAMPLING_FACTOR*SUPERSAMPLING_FACTOR); // calculate shader and combine
			}
		}
		
		return result;
	}

    void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        vec3 result = superSample(fragCoord);
        gl_FragColor = vec4(result, 1.0);
    }
`;



// function to handle slider and color wheel values change
function handleValueChange(id, uniform) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('input', function () {
            const value = parseFloat(element.value);
            if (uniform === "SUPERSAMPLING_FACTOR") {
                uniforms[uniform].value = 16; // set high supersampling for render
            } else {
                uniforms[uniform].value = value;
            }
        });
    }
}


handleValueChange('globalSpeed', 'GLOBAL_SPEED');
handleValueChange('globalScale', 'GLOBAL_SCALE');
handleValueChange('freq', 'FREQ');
handleValueChange('baseSpeed', 'BASE_SPEED');
handleValueChange('dirFlips', 'DIR_FLIPS');
handleValueChange('noiseFreq', 'NOISE_FREQ');
handleValueChange('noiseSpeed', 'NOISE_SPEED');
handleValueChange('noiseAngAmp', 'NOISE_ANG_AMP');
handleValueChange('noiseRadAmp', 'NOISE_RAD_AMP');
handleValueChange('pulseFreq', 'PULSE_FREQ');
handleValueChange('pulseSpeed', 'PULSE_SPEED');
handleValueChange('pulseExp', 'PULSE_EXP');
handleValueChange('pulseAmp', 'PULSE_AMP');
handleValueChange('hue', 'HUE');
handleValueChange('sat', 'SAT');
handleValueChange('val', 'VAL');
handleValueChange('lineExp', 'LINE_EXP');
handleValueChange('concentric', 'CONCENTRIC');
handleValueChange('concentricSpeed', 'CONCENTRIC_SPEED');
handleValueChange('motionBlur', 'MOTION_BLUR');
handleValueChange('superSample', 'SUPERSAMPLING_FACTOR');
handleValueChange('pulseHue', 'PULSE_HUE');
handleValueChange('exp', 'EXP');
handleValueChange('forceLoop-actualNum', 'FORCE_LOOP');
handleValueChange('loopPeriod', 'LOOP_PERIOD');
handleValueChange('loop-transTime', 'TRANS_TIME');
handleValueChange('loop-edgeFeather', 'LOOP_FEATHER');
handleValueChange('reverseTransDir-actualNum', 'LOOP_REVERSE');


const uniforms = {
    iResolution: { value: new THREE.Vector2(canvas.width, canvas.height) },
    iTime: { value: 0 },
    GLOBAL_SPEED: { value: 1.0 },
	GLOBAL_SCALE: { value: 1.0 },
    FREQ: { value: 20.0 },
    BASE_SPEED: { value: 5.0 },
    DIR_FLIPS: { value: 5 },
    NOISE_FREQ: { value: 6.0 },
    NOISE_SPEED: { value: -0.2 },
    NOISE_ANG_AMP: { value: 0.0 },
    NOISE_RAD_AMP: { value: 0.0 },
    PULSE_FREQ: { value: 10.6 },
    PULSE_SPEED: { value: 1.5 },
    PULSE_EXP: { value: 2.0 },
    PULSE_AMP: { value: 2.0 },
    LINE_EXP: { value: 3.0 },
    CONCENTRIC: { value: 0.0 },
	CONCENTRIC_SPEED: { value: 0.0 },
	HUE: { value: 0.7 },
	SAT: { value: 1.2 },
	VAL: { value: 1.5 },
    MOTION_BLUR: { value: 0.75 },
	SUPERSAMPLING_FACTOR: { value: 4 },
	PULSE_HUE: { value: 0 },
	EXP: { value: 1.0 },
	FORCE_LOOP: { value: 1 },
	LOOP_PERIOD: { value: 6.0 },
	TRANS_TIME: { value: 5.0 },
	LOOP_FEATHER: { value: 0.6 },
	LOOP_REVERSE: { value: 0 },
};

const material = new THREE.ShaderMaterial({
    uniforms,
    fragmentShader,
    vertexShader: `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = vec4( position, 1.0 );
        }
    `,
});

const mesh = new THREE.Mesh(plane, material);
scene.add(mesh);





let startTime = null;
let backgroundImage = null;
let recFrameCount = 0;
let renderFramerate, renderWidth, renderHeight, renderTime, capturer;

// https://stackoverflow.com/a/73401564
function RGBAToHexA(rgba, forceRemoveAlpha = false) {
	return "#" + rgba.replace(/^rgba?\(|\s+|\)$/g, '') // Gets rgba / rgb string values
	  .split(',') // splits them at ","
	  .filter((string, index) => !forceRemoveAlpha || index !== 3)
	  .map(string => parseFloat(string)) // Converts them to numbers
	  .map((number, index) => index === 3 ? Math.round(number * 255) : number) // Converts alpha to 255 number
	  .map(number => number.toString(16)) // Converts numbers to hex
	  .map(string => string.length === 1 ? "0" + string : string) // Adds 0 when length of one number is 1
	  .join("") // Puts the array to togehter to a string
  }

// Composites the spiral, the text, and the background image onto a hidden 2D canvas for rendering
function composite() {
    // Step 1: clear the existing canvas
    compositeCanvasContext.clearRect(0, 0, renderWidth, renderHeight);

    // Step 2: draw the spiral at full opacity
    compositeCanvasContext.globalAlpha = 1.0;
    compositeCanvasContext.drawImage(canvas, 0, 0);

    // Step 3: if there's a background image, draw it at its given opacity
    if(backgroundImage) {
        compositeCanvasContext.globalAlpha = document.getElementById("backgroundImage").style.opacity;
	compositeCanvasContext.drawImage(backgroundImage, 0, 0, renderWidth, renderHeight);
    }

    // Step 4 (the fun part): draw the text
    if(hypnoText.innerText) {
	// Text opacity is hardcoded at 0.5. If that ever changes, this will need to be updated too.
	compositeCanvasContext.globalAlpha = 0.5;
	compositeCanvasContext.textAlign = "center";

	// Have to use computed style or it doesn't detect the color correctly
	var computedStyle = window.getComputedStyle(hypnoText);
	compositeCanvasContext.fillStyle = RGBAToHexA(computedStyle.getPropertyValue("color"), true);

	// Scale down the font size from (dimensions in our browser) to (dimensions in the rendered GIF)
	var computedFontSize = parseFloat(computedStyle.getPropertyValue("font-size"));
	var adjustedFontSize = computedFontSize * (parseFloat(renderHeight) / canvas.offsetHeight);
	compositeCanvasContext.font = adjustedFontSize + "px " + computedStyle.getPropertyValue("font-family");

	// Calculate the height of the font so we can vertically center it
	var calculatedFontMeasure = compositeCanvasContext.measureText(hypnoText.innerText);
	var calculatedFontHeight = calculatedFontMeasure.actualBoundingBoxAscent - calculatedFontMeasure.actualBoundingBoxDescent;

	// Finally, draw the text in the middle
	compositeCanvasContext.fillText(hypnoText.innerText, renderWidth / 2, calculatedFontHeight / 2 + parseFloat(renderHeight) / 2);
    }
}

function recRender(time) {
    renderFramerate = document.getElementById("render-framerate").value;
    renderWidth = document.getElementById("render-width").value;
    renderHeight = document.getElementById("render-height").value;
    renderTime = document.getElementById("loopPeriod").value;

    const maxFrames = (renderTime * renderFramerate) - 0;

    if (startTime === null) {
        startTime = time;
    }

    renderer.setSize(renderWidth, renderHeight, false);
    uniforms.iResolution.value.set(renderWidth, renderHeight);

    compositeCanvas.width = renderWidth;
    compositeCanvas.height = renderHeight;

    time = startTime;
    startTime += 1000 / renderFramerate;

    uniforms.iTime.value = time * 0.001;

    renderer.render(scene, camera);

    if (recFrameCount < maxFrames) {
        composite();
	capturer.capture(compositeCanvas);
        recFrameCount++;
    } else if (recFrameCount === maxFrames) {
        capturer.stop();
        capturer.save();
        recFrameCount++;
    } else {
        // Blank out screen and stop rendering
        renderer.clear();
        return;
    }

    requestAnimationFrame(recRender);
}

function startRendering() {
    renderFormat = document.getElementById("render-format").value;
    renderFramerate = document.getElementById("render-framerate").value;
    renderWidth = document.getElementById("render-width").value;
    renderHeight = document.getElementById("render-height").value;
    renderTime = document.getElementById("loopPeriod").value;
    
    console.log(renderFormat, renderFramerate, renderWidth, renderHeight, renderTime);

    capturer = new CCapture({
        name: 'dd_generated_spiral',
        format: renderFormat,
        workersPath: '',
        verbose: true,
        framerate: renderFramerate,
        display: true,
        width: renderWidth,
        height: renderHeight,
    });

    requestAnimationFrame(recRender);
    capturer.start();
}

function generateRenderSequence() {
    backgroundImage = document.getElementById("backgroundImage")
    backgroundImage.crossOrigin="anonymous";  // fixes certain CORS complaints

    // Do some thoroughly cursed shit to avoid CORS burning down our house, as per usual
    backgroundImage.crossOrigin="anonymous";
    if(backgroundImage.src) {
	// Disable CORS proxy for now, since it breaks under unknown conditions
	// One of these conditions is loading Discord images, which sucks, because that's where our hypno nonsense is
        // backgroundImage.src = "https://corsproxy.io/?" + encodeURIComponent(backgroundImage.src)

        // ensure the background image loads before we start recording
        backgroundImage.onload = startRendering;
    }
    else {
        startRendering();
    }
}
