var util_usingFixedBackgroundImageSize = false;

function util_SetFixedSizeBackgroundImage() {
    if(!util_usingFixedBackgroundImageSize) {
        return;
    }

    let backgroundImage = document.getElementById("backgroundImage");
    let canvas = document.getElementById("spiralCanvas");

    // We want to stretch the image in one direction until it hits the boundary of the window.
    // To do that, first we figure out which direction we'd hit the window in first:
    let verticalScaleFactor = window.innerHeight / backgroundImage.naturalHeight;
    let horizontalScaleFactor = window.innerWidth / backgroundImage.naturalWidth;

    let newHeight;
    let newWidth;
    if(Math.abs(1 - verticalScaleFactor) > Math.abs(1 - horizontalScaleFactor)) {
        newHeight = backgroundImage.naturalHeight * horizontalScaleFactor; 
        newWidth = backgroundImage.naturalWidth * horizontalScaleFactor;
    }
    else {
        newHeight = backgroundImage.naturalHeight * verticalScaleFactor; 
        newWidth = backgroundImage.naturalWidth * verticalScaleFactor;
    }

    backgroundImage.style.width = newWidth + "px";
    backgroundImage.style.height = newHeight + "px";
    canvas.style.width = newWidth + "px";
    canvas.style.height = newHeight + "px";
}

function util_toggleUseFixedSizeBackgroundImage() {
    let button = document.getElementById("backgroundImageStretchButton");
    if(util_usingFixedBackgroundImageSize) {
        backgroundImage.style.width = "";
        backgroundImage.style.height = "";
        canvas.style.width = "";
        canvas.style.height = "";

        util_usingFixedBackgroundImageSize = !util_usingFixedBackgroundImageSize;
        
        button.classList.remove("active");
        button.innerText = "Turn Off Background Image Stretching";
    }
    else {
        // set before calling setFixedSizeBackgroundImage so it actually works
        util_usingFixedBackgroundImageSize = !util_usingFixedBackgroundImageSize;

        util_SetFixedSizeBackgroundImage()

        button.classList.add("active");
        button.innerText = "Turn On Background Image Stretching";
    }

}

function utils_sendHideUI() {
    document.body.dispatchEvent(new KeyboardEvent("keydown", { "key": "H" }));
}

window.addEventListener("resize", util_SetFixedSizeBackgroundImage);
