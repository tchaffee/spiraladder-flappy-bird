let flappyBird = (function () {

  // Set up and variables that apply to the entire game.
  // TODO: Should the canvas be here?
  const game = (function () {

    let score;
    let gravity = 1.5;

    function reset() {
      game.score = 0;
      images.reset();
      pipes.reset();
    }

    // TODO: Can we pass the bird object to this?
    function moveUp() {
      if (images.bird.yPos > 25) {
        images.bird.yPos -= 25;
      }
      sounds.fly.play();
    }

    // Move the bird up with any key press.
    document.addEventListener('keydown', moveUp);    

    function increaseScore() {
      game.score++;
      sounds.score.play();
    }

    return {
      gravity: gravity,
      score: score,
      reset: reset,
      increaseScore: increaseScore
    };

  })();

  // TODO: Not sure if we need this. It only hides two variables...
  const drawing = (function () {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    return {
      canvas: canvas,
      context: context
    }
  })();

  // List of pipes.
  let pipes = (function () {

    let pipeList;
    let pipeGap;

    function isPipeOffScreen(pipe) {
      // TODO: Make this DRY
      const pipeBack =  pipe.x + images.pipeTop.width;

      return pipeBack < 0;
    }

    function removeFirstPipe() {
      // How can I decouple this?
      game.increaseScore();
      pipeList.shift();
    }

    function draw() {

      // If the first pipe is no longer visible, remove it.
      if (isPipeOffScreen(pipeList[0])) {
        removeFirstPipe();
      }

      for(var i = 0; i < pipeList.length; i++){        

        // Move the pipe to the left.
        pipeList[i].x--;

        drawOnePipe(pipeList[i]);

        if (needNewPipe(pipeList[i])) {
          newPipe();
        }

      }
    }

    function drawOnePipe(pipe) {
      images.pipeTop.draw(pipe.x, pipe.topY);
      images.pipeBottom.draw(pipe.x, pipe.bottomY);
    }

    function needNewPipe(pipe) {
      return pipe.x === 100;
    }
    
    function newPipe() {
      const y = 
        Math.floor(Math.random() * images.pipeTop.height) - 
        images.pipeTop.height;

      add(y);
    }

    // Adds a pipe to the list of pipes.
    function add(y) {
      pipeList.push({
          x : drawing.canvas.width - images.pipeTop.width,
          topY : y,
          bottomY : y + pipes.pipeGap
      }); 
    }

    function reset() {
      pipeList = [];
      add(0);
    }

    function getPipe(i) {
      return pipeList[i];
    }

    // TODO: Can pipeGap be made internal?
    return {
      add: add,
      reset: reset,
      pipeGap: pipeGap,
      draw: draw,
      getPipe: getPipe
    }

  })();

  const assetsBaseUrl = 
    'https://s3-us-west-2.amazonaws.com/spiraladder-flappybird/';


  // Images
  const images = (function (assetsBaseUrl, drawing, pipes) {
    const bird = new Image();
    const background = new Image();
    const foreground = new Image();
    const pipeTop = new Image();
    const pipeBottom = new Image();

    const totalImages = 5;
    let loadedImages = 0;

    bird.src = assetsBaseUrl + 'bird.png';
    background.src = assetsBaseUrl + 'background.png';
    foreground.src = assetsBaseUrl + 'foreground.png';
    pipeTop.src = assetsBaseUrl + 'pipeTop.png';
    pipeBottom.src = assetsBaseUrl + 'pipeBottom.png';

    bird.draw = function () {
      drawing.context.drawImage(this, this.xPos, this.yPos);
    }
    bird.draw.bind(bird);

    background.draw = function () {
      drawing.context.drawImage(background, 0, 0);
    }

    foreground.draw = function () {
      drawing.context.drawImage(foreground, 0, 
        drawing.canvas.height - images.foreground.height
      );
    }

    pipeTop.draw = function (x, y) {
      drawing.context.drawImage(pipeTop, x, y);
    }

    pipeBottom.draw = function (x, y) {
      drawing.context.drawImage(pipeBottom, x, y);
    }

    function imageLoaded () {
      loadedImages++;
    }

    bird.onload = imageLoaded;
    background.onload = imageLoaded;
    foreground.onload = imageLoaded;
    pipeBottom.onload = imageLoaded;

    pipeTop.onload = function () {
      const gap = 200;
      console.log('setting pipegap.');
      pipes.pipeGap = images.pipeTop.height + gap;
      imageLoaded();
    }

    bird.applyGravity= function() {

      // Don't let the bird go below the foreground.
      // TODO: Check this calculation
      if (bird.yPos < 
        (images.background.height - images.foreground.height - bird.height))
      {
        bird.yPos += game.gravity;
      }
    }

    function ready() {
      return loadedImages === totalImages;
    }

    function reset() {
      bird.xPos = 10;
      bird.yPos = 150;
    }

    return {
      bird: bird,
      background: background,
      foreground: foreground,
      pipeTop: pipeTop,
      pipeBottom: pipeBottom,
      ready: ready,
      reset: reset,
      pipes: pipes
    }

  })(assetsBaseUrl, drawing, pipes);

  // Sounds
  const sounds = (function (assetsBaseUrl) {
    const fly = new Audio();
    const score = new Audio();

    fly.src = assetsBaseUrl + 'fly.mp3';
    score.src = assetsBaseUrl + 'score.mp3';

    return {
      fly: fly,
      score: score,
    }

  })(assetsBaseUrl);

  function detectForegroundCollision () {
    const birdBottom = images.bird.yPos + images.bird.height;
    const foregroundTop = drawing.canvas.height - images.foreground.height;

    if(birdBottom >= foregroundTop ) {
      return true;
    }
    return false;
  }

  function drawScore() {
    drawing.context.fillStyle = "#000";
    drawing.context.font = "20px Verdana";
    drawing.context.fillText("Score : " + game.score, 10, drawing.canvas.height - 20);
  }

  function detectPipeCollision() {

    const pipe = pipes.getPipe(0);

    const birdBack = images.bird.xPos;
    const birdFront = birdBack + images.bird.width;
    const pipeFront =  pipe.x;
    const pipeBack =  pipeFront + images.pipeTop.width;

    const birdTop = images.bird.yPos;
    const birdBottom = birdTop + images.bird.height;
    const pipeTopEdge = pipe.topY + images.pipeTop.height;
    const pipeBottomEdge = pipe.bottomY;

    function isBirdInsidePipeWidth () {
      return (birdFront >= pipeFront && birdFront <= pipeBack) ||
        (birdBack >= pipeFront && birdBack <= pipeBack);
    }

    function isBirdInsidePipeVerticle() {
      return (birdTop <= pipeTopEdge) || (birdBottom >= pipeBottomEdge);
    }

    if (! isBirdInsidePipeVerticle()) return false;

    if (! isBirdInsidePipeWidth()) return false;

    return true;

  }

  function play() {
      
    images.background.draw();
  
    images.pipes.draw();

    images.foreground.draw();
    
    images.bird.applyGravity();

    images.bird.draw();
    
    if (detectPipeCollision()) {
      game.reset();
    }

    if (detectForegroundCollision()) {
      game.reset();
    }

    drawScore();

    requestAnimationFrame(play);

  }

  function start() {

    // If images have not loaded, try again soon.
    if (! images.ready()) {
      setTimeout(start, 500);
      return;
    }

    game.reset();
    play();
  }

  return {
    start: start    
  }

})();


flappyBird.start();