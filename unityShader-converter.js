

function generateUnityShader() {
	
	
	
	// Variables for writing Unity shader
	const globalSpeed = document.getElementById('globalSpeed').value;
	const globalScale = document.getElementById('globalScale').value;
	const freq = document.getElementById('freq').value;
	const baseSpeed = document.getElementById('baseSpeed').value;
	const dirFlips = document.getElementById('dirFlips').value;
	const concentric = document.getElementById('concentric').value;
	const concentricSpeed = document.getElementById('concentricSpeed').value;
	const noiseAngAmp = document.getElementById('noiseAngAmp').value;
	const noiseRadAmp = document.getElementById('noiseRadAmp').value;
	const noiseFreq = document.getElementById('noiseFreq').value;
	const noiseSpeed = document.getElementById('noiseSpeed').value;
	const pulseAmp = document.getElementById('pulseAmp').value;
	const pulseFreq = document.getElementById('pulseFreq').value;
	const pulseSpeed = document.getElementById('pulseSpeed').value;
	const hue = document.getElementById('hue').value;
	const sat = document.getElementById('sat').value;
	const val = document.getElementById('val').value;
	const lineExp = document.getElementById('lineExp').value;
	const motionBlur = document.getElementById('motionBlur').value;
	const superSample = document.getElementById('superSample').value;
	const pulseExp = document.getElementById('pulseExp').value;
	const pulseHue = document.getElementById('pulseHue').value;
	const exp = document.getElementById('exp').value;

	const forceLoopActualNum = document.getElementById('forceLoop-actualNum').value;
	const loopPeriod = document.getElementById('loopPeriod').value;
	const loopTransTime = document.getElementById('loop-transTime').value;
	const loopEdgeFeather = document.getElementById('loop-edgeFeather').value;
	const reverseTransDirActualNum = document.getElementById('reverseTransDir-actualNum').value;
	
	
	
	// Generate Unity shader
	const unityTemplate =
`Shader "Custom/DD_Generated_Spiral"
{
    Properties
    {
        _MainTex("Texture", 2D) = "white" {}
        _GlobalSpeed("Global Speed", Range(-5, 5)) = ${globalSpeed}
        _GlobalScale("Global Scale", Range(0.1, 5)) = ${globalScale}

        _Freq("Base Frequency", Range(0, 180)) = ${freq}
        _Exp("Base Exponent", Range(1, 4)) = ${exp}
        _BaseSpeed("Base Speed", Range(-40, 40)) = ${baseSpeed}
        _Concentric("Concentric", Range(-50, 50)) = ${concentric}
        _ConcentricSpeed("Concentric Speed", Range(-10, 10)) = ${concentricSpeed}
        _NoiseFreq("Noise Frequency", Range(0, 40)) = ${noiseFreq}
        _NoiseSpeed("Noise Rotation Speed", Range(-5, 5)) = ${noiseSpeed}
        _NoiseAngAmp("Noise Amplitude (angle)", Range(-5, 5)) = ${noiseAngAmp}
        _NoiseRadAmp("Noise Amplitude (radius)", Range(-0.1, 0.1)) = ${noiseRadAmp}
        _PulseFreq("Pulse Frequency", Range(0, 40)) = ${pulseFreq}
        _PulseSpeed("Pulse Speed", Range(-10, 10)) = ${pulseSpeed}
        _PulseExp("Pulse Exponent", Range(0, 10)) = ${pulseExp}
        _PulseAmp("Pulse Amplitude", Range(-10, 10)) = ${pulseAmp}
        _DirFlips("Direction Flips (pulse-based)", Range(-10, 10)) = ${dirFlips}
        _PulseHue("Pulse Hue-shift", Range(-1, 1)) = ${pulseHue}

        _Hue("Hue", Range(0, 1)) = ${hue}
        _Sat("Saturation", Range(0, 2)) = ${sat}
        _Val("Brightness", Range(0, 10)) = ${val}

        _LineExp("Line Feather", Range(0, 10)) = ${lineExp}

        _MotionBlur("Motion Blur", Range(0, 10)) = ${motionBlur}
        _SuperSamplingFactor("Super Sampling Factor (Blur / AA quality)", Range(1, 8)) = ${superSample}

        _ForceLoop("Force Loop", Range(0, 1)) = ${forceLoopActualNum}
        _LoopPeriod("Loop Period", Range(1, 100)) = ${loopPeriod}
        _TransTime("Loop Transition Time", Range(0, 100)) = ${loopTransTime}
        _LoopFeather("Transition Edge Feather", Range(0, 1)) = ${loopEdgeFeather}
        _LoopReverse("Reverse Transition Direction", Range(0, 1)) = ${reverseTransDirActualNum}
    }

    SubShader
    {
        Tags
        {
            "Queue" = "Geometry"
            "RenderType" = "Opaque"
        }
        LOD 100

        CGPROGRAM
        #pragma surface surf Lambert
        #include "UnityCG.cginc"

        sampler2D _MainTex;

        float _GlobalSpeed;
        float _GlobalScale;

        float _Freq;
        float _Exp;
        float _BaseSpeed;
        int _DirFlips;
        float _Concentric;
        float _ConcentricSpeed;

        float _NoiseFreq;
        float _NoiseSpeed;
        float _NoiseAngAmp;
        float _NoiseRadAmp;

        float _PulseFreq;
        float _PulseSpeed;
        float _PulseExp;
        float _PulseAmp;
        float _PulseHue;

        float _Hue;
        float _Sat;
        float _Val;

        float _LineExp;

        float _MotionBlur;
        int _SuperSamplingFactor;

        int _ForceLoop;
        float _LoopPeriod;
        float _TransTime;
        float _LoopFeather;
        int _LoopReverse;

        struct Input
        {
            float2 uv_MainTex;
        };

        float rand(float2 n) {
            return frac(sin(dot(n, float2(12.9898, 4.1414))) * 43758.5453);
        }

        float noise(float2 n) {
            const float2 d = float2(0.0, 1.0);
            float2 b = floor(n), f = frac(n);
            return lerp(lerp(rand(b), rand(b + d.yx), f.x), lerp(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
        }

        float2 c2p(float2 p){
            float angle = atan2(p.y, p.x);
            float radius = length(p);
            return float2(radius, angle);
        }

        float2 p2c(float2 polar){
            float x = polar.x * cos(polar.y);
            float y = polar.x * sin(polar.y);
            return float2(x, y);
        }

        // Convert Hue/Sat/Val to RGB
        float3 hsv2rgb(float3 c) {
            float4 K = float4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            float3 p = abs(frac(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * lerp(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        // Custom power function, because uniforms break pow() for some god-forsaken reason
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

        // Main fragment shader
        float3 primaryShader(float2 fragCoord, float inTime)
        {
            // Zero-centered uv space
            float2 p_shortNorm = float2((fragCoord.x / 1 - 0.5) * (1 / min(1, 1)) * 2.0, (fragCoord.y / 1 - 0.5) * (1 / min(1, 1)) * 2.0);
            float2 p = p_shortNorm / (_GlobalScale*0.8);

            // Aspect ratio of screen
            float aspect = max(1, 1) / min(1, 1);

            // Get polar coordinates
            float2 polar = c2p(p);

            if (_ForceLoop == 1) {
                float timeA = fmod(inTime, _LoopPeriod); // Normal time
                float timeB = fmod(inTime+(_LoopPeriod*0.5), _LoopPeriod); // Out of phase time

                float transGrad = 1.0 - ((polar.x * _GlobalScale) / (aspect * 1.4145)); // Normalized transition gradient (could be direction, radius, some spiral thing, etc)
                if (_LoopReverse == 1) {transGrad = 1.0 - transGrad;} // Reverse direction
                float swapValue = remap(fmod(inTime, _LoopPeriod*0.5), (_LoopPeriod*0.5)-_TransTime, _LoopPeriod*0.5, 0.0, 1.0); // Broken-up linear curve over time for actual transition factor
                float swapValue_clamped = clamp(swapValue, 0.0, 1.0); // Clamp to actually break up the linear curve

                float featherCurve = abs(transGrad - swapValue_clamped) * (1.0 / customPow(_LoopFeather*0.5,2.0));
                featherCurve = clamp(featherCurve, 0.0, 1.0);
                featherCurve = 1.0 - featherCurve;
                featherCurve = customPow(featherCurve, 1.0);

                swapValue_clamped -= rand(fragCoord) * (featherCurve * _TransTime * 0.01); // Edge feather

                float viewA, viewB; // Placeholder times so that they can be swapped without issues

                // Swap times past half-way point (necessary for same-direction transitioning)
                if (timeA > _LoopPeriod*0.5) {
                    viewA = timeA;
                    viewB = timeB;
                }
                else {
                    viewA = timeB;
                    viewB = timeA;
                }

                // Actually swap between times based on transition gradient and swap value
                if (swapValue_clamped < transGrad) {
                    inTime = viewA;
                }
                else {
                    inTime = viewB;
                }
            }

            float globalTime = inTime * _GlobalSpeed;

            // Noise
            float2 noiseSampleP = p2c(float2(polar.x, polar.y + globalTime * _NoiseSpeed)); // Rotate the uv-space the noise will be sampling from (to rotate the noise)
            float2 displace = float2(noise(noiseSampleP * _NoiseFreq), 0.0); // Calculate noise
            polar.y += displace.x * _NoiseAngAmp; // Displace spiral with noise (polar.y affects displacement)
            polar.x += displace.y * _NoiseRadAmp; // Darken spiral with noise (polar.x affects brightness)

            // Spiral
            polar.y += clamp(tan(polar.x * _Concentric + globalTime * _ConcentricSpeed * _Concentric), -25.0, 25.0); // Add concentric circles
            polar.y += customPow(polar.x, _Exp) * _Freq + globalTime * _BaseSpeed; // Twist the uv space around the origin (basis of the spiral)
            float pulse = sin(polar.x * _PulseFreq + globalTime * _PulseSpeed); // Create pulse factor
            polar.y -= customPow(pulse, _PulseExp) * _PulseAmp; // Contract/expand based on pulse factor
            polar.y += (atan2(p.y,p.x) - pulse*_PulseAmp) * float(_DirFlips); // Cool and weird effect (happy accident)
            float newHue = _Hue + pulse * _PulseHue; // Modulate hue with pulse

            // Convert spiralized polar coords back to cartesian
            p = p2c(polar);

            // Make line (which will now be a spiral because of the warped coordinates)
            float bright = 1.0 - abs(p.y); // Make base linear value
            bright += abs(p.x) * -0.2; // Make it look nice
            bright *= 1.8; // Make it look nice
            bright *= customPow(clamp(p.x, 0.0, 0.5), 0.5); // Cut left half out
            bright = customPow(bright*0.8, _LineExp); // Exponent (sharpness)
            bright = clamp(bright, 0.0, 1.0); // Clamp final brightness

            float3 inColor = hsv2rgb(float3(newHue, _Sat*0.6, _Val)); // Color of inner line
            float3 outColor = hsv2rgb(float3(newHue, _Sat*1.15, _Val)); // Color of glow around line
            float3 col = lerp(outColor, inColor, bright); // Interpolate between in/out colors
            col *= bright; // Black background

            return col;
        }

        // Supersampling (for anti-aliasing)
        float3 superSample(float2 fragCoord) {

            float3 result = float3(0.0, 0.0, 0.0);

            // Calculate the one-pixel step in UV space
            float2 pixelStep = (ddx(fragCoord) + ddy(fragCoord)) * 0.5;

            // Calculate shader at subpixels and sum for average color
            for (int x = 0; x < _SuperSamplingFactor; x++) {
                for (int y = 0; y < _SuperSamplingFactor; y++) {
                    float2 subpixelOffset = float2(float(x) / float(_SuperSamplingFactor), float(y) / float(_SuperSamplingFactor)); // Subpixel offset

                    // Apply subpixel offset within the fragment
                    float2 fragCoord_offset = fragCoord + subpixelOffset * pixelStep;

                    float timeOffset = _Time.y + rand(subpixelOffset) * _MotionBlur * 0.04; // Time offset (for motion blur)

                    result += primaryShader(fragCoord_offset, timeOffset) / float(_SuperSamplingFactor * _SuperSamplingFactor); // Calculate shader and combine
                }
            }

            return result;
        }


        void surf(Input IN, inout SurfaceOutput o)
        {
            // Get fragment coordinates
            float2 fragCoord = IN.uv_MainTex;

            // Calculate the result color
            float3 result = superSample(fragCoord);

            // Output the color
            o.Albedo = result.rgb;
        }
        ENDCG
    }
    FallBack "Diffuse"
}
`;



	// Create a Blob containing the Python code
	const unityBlob = new Blob([unityTemplate], { type: 'text/plain' });
	const unityUrl = URL.createObjectURL(unityBlob);

	// Create a download link and click it to download the .py file
	const downloadAnchor = document.getElementById('downloadAnchor');
	downloadAnchor.href = unityUrl;
	downloadAnchor.download = 'dd_generated_spiral.shader';
	downloadAnchor.style.display = 'block';
	downloadAnchor.click();
	setTimeout(() => {
		URL.revokeObjectURL(unityUrl);
	}, 1000);
}