// Internal canvase and context.
let internalCanvas = null;
let canvasContext = null;

let getImage = (function (name) {
  let imagesLoaded = false;
  let images = {};

  function loadImages() {
    images.bird = new Image();
    images.bg = new Image();
    images.fg = new Image();
    images.pipeNorth = new Image();
    images.pipeSouth = new Image();
    
    images.bird.src = "images/bird.png";
    images.bg.src = "images/bg.png";
    images.fg.src = "images/fg.png";
    images.pipeNorth.src = "images/pipeNorth.png";
    images.pipeSouth.src = "images/pipeSouth.png";

    imagesLoaded = true;
  }

  return function returnImage(name) {
    if (! imagesLoaded) {
      loadImages();
    }

    return images[name];

  }

})();

let context = {
  drawImage: function (imageName, ...params) {
    canvasContext.draw(getImage(imageName, ...params));
  }
}

let canvas = {
  getDrawingContext:  function () {
    internalCanvas = document.getElementById('canvas');
    canvasContext = internalCanvas.getContext('2d');
    return context;
  }
};

export default canvas;