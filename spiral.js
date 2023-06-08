const canvas = document.getElementById('myCanvas');
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
    uniform float BASE_SPEED;
	uniform int DIR_FLIPS;
	uniform float CONCENTRIC;

    uniform float NOISE_FREQ;
    uniform float NOISE_SPEED;
    uniform float NOISE_ANG_AMP;
	uniform float NOISE_RAD_AMP;

    uniform float PULSE_FREQ;
    uniform float PULSE_SPEED;
    uniform float PULSE_EXP;
    uniform float PULSE_AMP;
	
	uniform float HUE;
	uniform float SAT;
	uniform float VAL;
	
	uniform float LINE_EXP;
	
	uniform float MOTION_BLUR;
	uniform int SUPERSAMPLING_FACTOR; // Supersampling factor for anti-aliasing (higher = smoother but slower)

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

	// main fragment shader
	vec3 primaryShader( in vec2 fragCoord, in float inTime )
	{
		float globalTime = inTime * GLOBAL_SPEED;
		
		// zero-centered uv space
		vec2 p = vec2((fragCoord.x / iResolution.x - 0.5) * (iResolution.x / min(iResolution.x, iResolution.y)) * 2.0, (fragCoord.y / iResolution.y - 0.5) * (iResolution.y / min(iResolution.x, iResolution.y)) * 2.0);
		p /= GLOBAL_SCALE;
		
		// get polar coordinates
		vec2 polar = c2p(p);
		
		// noise
		vec2 noiseSampleP = p2c(vec2(polar.x, polar.y + globalTime * NOISE_SPEED)); // rotate the uv-space the noise will be sampling from (to rotate the noise)
		vec2 displace = vec2(noise(noiseSampleP * NOISE_FREQ)); // calculate noise
		polar.y += displace.x * NOISE_ANG_AMP; // displace spiral with noise (polar.y affects displacement)
		polar.x += displace.y * NOISE_RAD_AMP; // darken spiral with nosie (polar.x affects brightness)
			
		// Spiral
		polar.y += tan(polar.x * CONCENTRIC); // add concentric circles
		polar.y += polar.x * FREQ + globalTime * BASE_SPEED; // twist the uv space around the origin (basis of the spiral)
		float pulse = sin(polar.x * PULSE_FREQ + globalTime * PULSE_SPEED); // create pulse factor
		polar.y -= customPow(pulse, PULSE_EXP) * PULSE_AMP; // contract/expand based on pulse factor
		polar.y += (atan(p.y,p.x) - pulse*5.0) * float(DIR_FLIPS); // cool and weird effect (happy accident)
		
		// convert spiralized polar coords back to cartesian
		p = p2c(polar);
		
		
		// make line (which will now be a spiral because of the warped coordinates)
		float bright = 1.0 - abs(p.y); // make base linear value
		bright += abs(p.x) * -0.2; // make it look nice
		bright *= 1.8; // make it look nice
		bright *= customPow(clamp(p.x, 0.0, 0.5), 0.5); // cut left half out
		bright = customPow(bright, LINE_EXP); // exponent (sharpness)
		bright = clamp(bright, 0.0, 1.0); // clamp final brightness
		
		vec3 inColor = hsv2rgb(vec3(HUE, SAT*0.5, VAL)); // color of inner line
		vec3 outColor = hsv2rgb(vec3(HUE, SAT, VAL)); // color of glow around line
		vec3 col = mix(outColor, inColor, bright); // interpolate between in/out colors
		col *= bright; // black background

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
function handleValueChange(elementId, uniformName) {
    const element = document.getElementById(elementId);
    element.addEventListener('input', () => {
        uniforms[uniformName].value = parseFloat(element.value);
    });
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
handleValueChange('motionBlur', 'MOTION_BLUR');
handleValueChange('superSample', 'SUPERSAMPLING_FACTOR');


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
	HUE: { value: 0.7 },
	SAT: { value: 0.8 },
	VAL: { value: 1.5 },
    MOTION_BLUR: { value: 0.75 },
	SUPERSAMPLING_FACTOR: { value: 4 },
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

let advicePage = "gpu-error.html"
let prevTime = 0;
let terribleFPS = 10; // FPS for sending to advice page
let thresholdFPS = 52; // FPS for halving resolution
let scaleFactor = 1; // Initialize the scaling factor to 1
let minScaleFactor = 0.5; // Minimum scaling factor to prevent extremely low resolution               CHANGE BACK TO 0.5
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

function render(time) {
    time *= 0.001;
    uniforms.iTime.value = time;

    // Code for FPS display
    const deltaTime = time - prevTime;
    const FPS = 1 / deltaTime;
    prevTime = time;
    sumFPS += FPS;
    frameCount += 1;
	
    const averageFPS = sumFPS / frameCount;
    
    if (!resolutionAdapted && time >= samplePeriod) {
		if (averageFPS < terribleFPS) {
			window.location = advicePage;
			scaleFactor = 0.1;
            resolutionAdapted = true;
		} else if (averageFPS < thresholdFPS) {
            scaleFactor = minScaleFactor;
            resolutionAdapted = true;
        }
        
        frameCount = 0;
        sumFPS = 0;
    }

    // Display FPS and average FPS in a HTML element
    document.getElementById("fps").innerHTML = "Average FPS: " + Math.round(averageFPS);

    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}
requestAnimationFrame(render);
