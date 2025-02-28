const inputList = [
	{ elementType: 'textarea', inputType: 'textarea', inputId: 'hypnoText-input' },
	{ elementType: 'input', inputType: 'number', inputId: 'hypnoText-delay-input' },
	{ elementType: 'input', inputType: 'number', inputId: 'hypnoText-space-input' },
	{ elementType: 'input', inputType: 'range', inputId: 'hypnoText-size-input' },
	{ elementType: 'input', inputType: 'text', inputId: 'hypnoText-color-picker' },
	{ elementType: 'button', inputType: 'button_toggle', inputId: 'hypnoText-randomize-button' },
	{ elementType: 'input', inputType: 'range', inputId: 'globalSpeed' },
	{ elementType: 'input', inputType: 'range', inputId: 'globalScale' },
	{ elementType: 'input', inputType: 'range', inputId: 'freq' },
	{ elementType: 'input', inputType: 'range', inputId: 'baseSpeed' },
	{ elementType: 'input', inputType: 'range', inputId: 'dirFlips' },
	{ elementType: 'input', inputType: 'range', inputId: 'concentric' },
	{ elementType: 'input', inputType: 'range', inputId: 'concentricSpeed' },
	{ elementType: 'input', inputType: 'range', inputId: 'noiseAngAmp' },
	{ elementType: 'input', inputType: 'range', inputId: 'noiseRadAmp' },
	{ elementType: 'input', inputType: 'range', inputId: 'noiseFreq' },
	{ elementType: 'input', inputType: 'range', inputId: 'noiseSpeed' },
	{ elementType: 'input', inputType: 'range', inputId: 'pulseAmp' },
	{ elementType: 'input', inputType: 'range', inputId: 'pulseFreq' },
	{ elementType: 'input', inputType: 'range', inputId: 'pulseSpeed' },
	{ elementType: 'input', inputType: 'range', inputId: 'hue' },
	{ elementType: 'input', inputType: 'range', inputId: 'sat' },
	{ elementType: 'input', inputType: 'range', inputId: 'val' },
	{ elementType: 'input', inputType: 'range', inputId: 'lineExp' },
	{ elementType: 'input', inputType: 'range', inputId: 'motionBlur' },
	{ elementType: 'input', inputType: 'range', inputId: 'superSample' },
	{ elementType: 'input', inputType: 'range', inputId: 'hypnoText-fade-input' },
	{ elementType: 'input', inputType: 'range', inputId: 'pulseHue' },
	{ elementType: 'input', inputType: 'range', inputId: 'exp' },
	{ elementType: 'select', inputType: 'select', inputId: 'hypnoText-blendMode-input'},
	{ elementType: 'select', inputType: 'select', inputId: 'hypnoText-font-picker'},
	{ elementType: 'input', inputType: 'text', inputId: 'backgroundImageInput'},
	{ elementType: 'input', inputType: 'range', inputId: 'backgroundImageOpacity'},
	{ elementType: 'input', inputType: 'range', inputId: 'pulseExp' },
	{ elementType: 'input', inputType: 'number', inputId: 'forceLoop-actualNum' },
	{ elementType: 'input', inputType: 'number', inputId: 'loopPeriod' },
	{ elementType: 'input', inputType: 'number', inputId: 'loop-transTime' },
	{ elementType: 'input', inputType: 'range', inputId: 'loop-edgeFeather' },
	{ elementType: 'input', inputType: 'number', inputId: 'reverseTransDir-actualNum' },
	{ elementType: 'input', inputType: 'number', inputId: 'render-width' },
	{ elementType: 'input', inputType: 'number', inputId: 'render-height' },
	{ elementType: 'input', inputType: 'number', inputId: 'render-framerate' },
	{ elementType: 'select', inputType: 'select', inputId: 'render-format'},
	{ elementType: 'input', inputType: 'number', inputId: 'pend-on-actualNum' },
	{ elementType: 'input', inputType: 'range', inputId: 'pend-period' },
	{ elementType: 'input', inputType: 'range', inputId: 'pend-angle' },
	{ elementType: 'input', inputType: 'range', inputId: 'pend-length' },
	{ elementType: 'input', inputType: 'range', inputId: 'pend-size' },
	{ elementType: 'button', inputType: 'button_toggle', inputId: 'backgroundImageStretchButton' },
	{ elementType: 'input', inputType: 'text', inputId: 'audioInput'},
];

function generateURL(urlType) {

	let params = "";
	inputList.forEach(function (inputInfo) {
		let inputElement;
		if (inputInfo.elementType === 'button' || inputInfo.elementType === 'textarea') {
			inputElement = document.getElementById(inputInfo.inputId);
		} else {
			inputElement = document.querySelector(`${inputInfo.elementType}[type='${inputInfo.inputType}'][id='${inputInfo.inputId}']`);
		}

	    if (inputElement) {
		    let value;
		    if (inputInfo.inputType === 'button_toggle') {
		 	  value = inputElement.classList.contains('active') ? 'true' : 'false';
		    } else if (inputInfo.inputType === 'textarea') {
			  value = encodeURIComponent(inputElement.value.replace(/\r?\n/g, '\r\n'));
		    } else if (inputInfo.inputType === 'select') { // Handle select elements
			  value = encodeURIComponent(inputElement.value);
		    } else {
			  value = encodeURIComponent(inputElement.value);
		    }
		    params += `${value}&`;
		}
	});

	/* 
		We use is.gd for link shortening, since it's one of few URL shorteners with a nice open API.
		However, it also doesn't have CORS enabled. That means we have to send our request to is.gd
		through a CORS proxy. Isn't web development great?
	*/
	
	if (urlType === 'viewer') {
		var url = "https://diamond-dogg.github.io/spiral_generator_prealpha/viewer.html?" + LZString.compressToEncodedURIComponent(params);
		var copyURL = copyViewerURLToClipboard;
	} else if (urlType === 'project') {
		var url = "https://diamond-dogg.github.io/spiral_generator_prealpha/index.html?" + LZString.compressToEncodedURIComponent(params);
		var copyURL = copyEditorURLToClipboard;
	} else if (urlType === 'render') {
		var url = "https://diamond-dogg.github.io/spiral_generator_prealpha/render.html?" + LZString.compressToEncodedURIComponent(params);
		var copyURL = openRenderURL;
	}

	copyURL(url)
	// Commented out link shortener for now, until we can find a more permanent solution.
	/*try {
		fetch("https://api.wheel.to/v1/link/", {
			method: "POST",
			body: JSON.stringify({
				long_url: url
			})
		}).then((response) => {
			if(response.ok) {
				response.text().then((text) => {
					var jsonResponse = JSON.parse(text);
					copyURL("https://diamond-dogg.github.io/spiral_generator_prealpha/short.html?" + jsonResponse.id);
				})
			}
			else {
				console.log("Link shortener returned non-OK status: " + response.status);
				copyURL(url);
			}
		})
	}
	catch (err) {
		console.log("Error when fetching from link shortener: " + err);
		copyURL(url);
	}
 	*/
}







function onFontPickerChange(inputElement, value) {
    inputElement.value = value;
    let fontFamily = value;
    // Set the selected index of the fontPicker according to the given value
    for (let i = 0; i < fontPicker.options.length; i++) {
        if (fontPicker.options[i].value === fontFamily) {
            fontPicker.selectedIndex = i;
            break;
        }
    }

    WebFont.load({
        google: {
            families: [fontFamily]
        },
        active: function () {
            textContainer.style.fontFamily = fontFamily;
        }
    });
}



function getUrlParams(isRendering = false) {
	let urlParams = window.location.search;
	if (!urlParams.includes('&')) {
		urlParams = LZString.decompressFromEncodedURIComponent(urlParams.substring(1));
	} else {
		urlParams = urlParams.substring(1);
	}
	let values = urlParams.toString().split('&');

    console.log(urlParams.toString());

	var backgroundImage = document.getElementById("backgroundImage")
    values.forEach((value, index) => {
        let inputInfo = inputList[index];
        if (inputInfo) {
            let inputElement;
            if (inputInfo.elementType === 'button' || inputInfo.elementType === 'textarea') {
                inputElement = document.getElementById(inputInfo.inputId);
            } else {
                inputElement = document.querySelector(`${inputInfo.elementType}[type='${inputInfo.inputType}'][id='${inputInfo.inputId}']`);
            }

			if (inputInfo.inputId == "backgroundImageInput") {
				let imageSource = decodeURIComponent(value);
				if(imageSource) {
					// Avoid setting the source to an empty string, which leads to thoroughly haunted problems later
					backgroundImage.src = imageSource;
				}
			} else if (inputInfo.inputId == "backgroundImageOpacity") {
				backgroundImage.style.opacity = decodeURIComponent(value);
			}
			else if (inputInfo.inputId == "backgroundImageStretchButton" && !isRendering) {
				// Make sure not to stretch the image when rendering; it's handled automatically.
				if(decodeURIComponent(value) == "true") {
					backgroundImage.onload = () => {
						util_toggleUseFixedSizeBackgroundImage();
					}
				}
			}

            if (inputElement) {
                let decodedValue = decodeURIComponent(value);
                inputElement.value = decodedValue;
                let event;

                if (inputInfo.inputType === 'button_toggle') {
                    if (decodedValue === 'true') { // If 'active'
                        inputElement.classList.add('active');
                    } else {
                        inputElement.classList.remove('active');
                    }

                    // Set the 'mode' variable based on the state of the randomize button
                    if (inputInfo.inputId === 'hypnoText-randomize-button') {
                        mode = inputElement.classList.contains('active') ? 'random' : 'sequential';
                    }
                } else if (inputInfo.inputType === 'textarea') {
                    inputElement.value = decodedValue.replace(/\\r\\n/g, '\r\n');
                    event = new Event('input');
                } else if (inputInfo.inputType === 'select') {
					if (inputInfo.inputId === 'hypnoText-font-picker') {
                        onFontPickerChange(inputElement, decodedValue);
                        event = new Event('change');
                    } else {
                        document.getElementById(inputInfo.inputId).value = decodedValue;
                        event = new Event('change');
                    }
                } else {
                    event = new Event('input');
                }

                if (event) {
                    inputElement.dispatchEvent(event);
                }
            }
        }
    });
}
