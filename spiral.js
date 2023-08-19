const canvas = document.getElementById('spiralCanvas');
const renderer = new THREE.WebGLRenderer({ canvas });

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
	
	uniform int PEND_ON;
	uniform float PEND_PERIOD;
	uniform float PEND_ANGLE;
	uniform float PEND_LENGTH;
	uniform float PEND_SIZE;
	
	
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
		if (PEND_ON == 1) {
			p /= PEND_SIZE;
		}
		
		// aspect ratio of screen
		float aspect = max(iResolution.x, iResolution.y) / min(iResolution.x, iResolution.y);
		
		// get polar coordinates
		vec2 polar = c2p(p);
		
		
		
		
		
		if (FORCE_LOOP == 1) {
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
	
	// pendulum transform
	vec2 pendulumUV( vec2 uv ) {
		uv = vec2((uv.x / iResolution.x - 0.5) * (iResolution.x / min(iResolution.x, iResolution.y)) * 2.0, (uv.y / iResolution.y - 0.5) * (iResolution.y / min(iResolution.x, iResolution.y)) * 2.0);
		
		uv -= vec2(0.0, 1.01);
		uv = c2p(uv);
		uv.y += sin(iTime * (6.2831853 / PEND_PERIOD)) * PEND_ANGLE;
		uv = p2c(uv);
		uv += vec2(0.0, PEND_LENGTH);
		
		uv = vec2((uv.x / 2.0 / (iResolution.x / min(iResolution.x, iResolution.y)) + 0.5) * iResolution.x, (uv.y / 2.0 / (iResolution.y / min(iResolution.x, iResolution.y)) + 0.5) * iResolution.y);
		return uv;
	}
	
	// pendulum drawing
	vec3 pendulumDraw ( vec2 uv, vec3 color ) {
		uv = vec2((uv.x / iResolution.x - 0.5) * (iResolution.x / min(iResolution.x, iResolution.y)) * 2.0, (uv.y / iResolution.y - 0.5) * (iResolution.y / min(iResolution.x, iResolution.y)) * 2.0);
		vec2 polar = c2p(uv);
		
		float size = PEND_SIZE;
		float borderWidth = 0.012;
		float stringWidth = 0.004;
		
		float innerMask = clamp(remap(polar.x, size, size+0.002, 1.0, 0.0), 0.0, 1.0);
		float outerMask = clamp(remap(polar.x, size+borderWidth, size+borderWidth+0.002, 1.0, 0.0), 0.0, 1.0);
		float borderMask = clamp(outerMask - innerMask, 0.0, 1.0);
		
		float left = clamp(remap(uv.x, stringWidth, stringWidth+0.002, 1.0, 0.0), 0.0, 1.0);
		float right = clamp(remap(uv.x, -(stringWidth+0.002), -stringWidth, 0.0, 1.0), 0.0, 1.0);
		float top = clamp(remap(uv.y, 0.0, 0.0, 0.0, 1.0), 0.0, 1.0);
		float stringMask = left * right * top;
		stringMask = clamp(stringMask -outerMask, 0.0, 1.0);
		
		
		
		
		color *= innerMask;
		color += vec3(0.25) * (borderMask + stringMask);
		
		return color;
	}

    void main() {
        vec2 fragCoord = gl_FragCoord.xy;
		if (PEND_ON == 1) {
			fragCoord = pendulumUV(fragCoord);
		}
		
        vec3 result = superSample(fragCoord);
		if (PEND_ON == 1) {
			result = pendulumDraw(fragCoord, result);
		}
        gl_FragColor = vec4(result, 1.0);
    }
`;



// function to handle slider and color wheel values change
function handleValueChange(id, uniform) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('input', function () {
            const value = parseFloat(element.value);
            if (uniform === "SUPERSAMPLING_FACTOR" && scaleFactor === performanceScaleFactor && value > 2) {
                uniforms[uniform].value = 2;
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
handleValueChange('pend-on-actualNum', 'PEND_ON');
handleValueChange('pend-period', 'PEND_PERIOD');
handleValueChange('pend-angle', 'PEND_ANGLE');
handleValueChange('pend-length', 'PEND_LENGTH');
handleValueChange('pend-size', 'PEND_SIZE');


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
	FORCE_LOOP: { value: 0 },
	LOOP_PERIOD: { value: 6.0 },
	TRANS_TIME: { value: 5.0 },
	LOOP_FEATHER: { value: 0.6 },
	LOOP_REVERSE: { value: 0 },
	PEND_ON: { value: 0 },
	PEND_PERIOD: { value: 6.0 },
	PEND_ANGLE: { value: 0.5 },
	PEND_LENGTH: { value: 1.5 },
	PEND_SIZE: { value: 0.3 },
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

let advicePage = "gpu-error.html";
let prevTime = performance.now() * 0.001;
let terribleFPS = 10; // FPS for sending to advice page
let thresholdFPS = 40; // FPS threshold for enabling performance mode
let scaleFactor = 1; // Initialize the scaling factor to 1
let performanceScaleFactor = 0.3; // performance mode scaling factor
let frameCount = 0; // Count number of frames in sample period
let samplePeriod = 3; // Seconds per sample period
let sumFPS = 0; // Sum of FPS values in sample period
let resolutionAdapted = false; // To check if resolution has been adapted

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = Math.floor(canvas.clientWidth * scaleFactor);
    const height = Math.floor(canvas.clientHeight * scaleFactor);
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
        uniforms.iResolution.value.set(width, height);
    }
    return needResize;
}

function render() {
  const currentTime = performance.now() * 0.001;
  uniforms.iTime.value = currentTime;

  // Code for FPS display
  let deltaTime;
  if (prevTime === 0) {
    deltaTime = 1 / 60; // Assume 60 FPS for first frame
  } else {
    deltaTime = currentTime - prevTime;
  }
  const FPS = 1 / deltaTime;
  prevTime = currentTime;
  sumFPS += FPS;
  frameCount += 1;

  const averageFPS = sumFPS / frameCount;

  if (!resolutionAdapted && currentTime >= samplePeriod && currentTime <= samplePeriod + 1) {
    if (averageFPS < terribleFPS) {
      window.location = advicePage;
      scaleFactor = 0.1;
      resolutionAdapted = true;
    } else if (averageFPS < thresholdFPS) {
      scaleFactor = performanceScaleFactor;
      resolutionAdapted = true;
    }


    frameCount = 0;
    sumFPS = 0;
  }

  // Display FPS and average FPS in a HTML element (DEPRECIATED)
  //document.getElementById("fps").innerHTML = "Average FPS: " + Math.round(averageFPS);

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
