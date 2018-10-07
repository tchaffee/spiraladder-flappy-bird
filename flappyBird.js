/* global document, Image, Audio, requestAnimationFrame, CustomEvent */
const flappyBird = (() => {
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');

  const gravity = 1.5;
  const pipeGap = 200;
  let background;
  let foreground;
  let pipes;
  let bird;

  const pipeRemovedEvent = new CustomEvent('pipeRemoved');
  const scoredEvent = new CustomEvent('scored');
  const birdMovedUp = new CustomEvent('birdMovedUp');

  const assetsBaseUrl = 'https://s3-us-west-2.amazonaws.com/spiraladder-flappybird/';

  const load = (() => {
    const getImage = () => url => new Promise((resolve, reject) => {
      const image = new Image();

      // Important success and error for the promise
      image.onload = () => resolve(image);
      image.onerror = () => reject(url);

      // Start fetching the image.
      image.src = url;
    });

    return {
      image: getImage(),
    };
  })();

  // Images
  const images = ((baseUrl) => {
    const imageStore = {};

    const loadImage = name => load.image(`${baseUrl}${name}.png`)
      .then((image) => { imageStore[name] = image; });

    const ready = () => Promise.all([
      loadImage('bird'),
      loadImage('background'),
      loadImage('foreground'),
      loadImage('pipeTop'),
      loadImage('pipeBottom'),
    ]);

    const get = name => imageStore[name];

    return {
      get,
      ready,
    };
  })(assetsBaseUrl);

  // Sounds
  const sounds = ((baseUrl) => {
    const flyAudio = new Audio();
    const scoreAudio = new Audio();

    flyAudio.src = `${baseUrl}fly.mp3`;
    scoreAudio.src = `${baseUrl}score.mp3`;

    return {
      fly: flyAudio,
      score: scoreAudio,
    };
  })(assetsBaseUrl);

  class Sprite {
    constructor(x, y, image) {
      this.height = image.height;
      this.width = image.width;
      this.x = x;
      this.y = y;
      this.image = image;
    }

    draw() {
      context.drawImage(
        this.image,
        this.x,
        this.y,
      );
    }
  }

  // Everything to do with scoring.
  const score = (() => {
    let scoreValue = 0;

    const get = () => scoreValue;

    const plus = () => {
      scoreValue += 1;
      document.dispatchEvent(scoredEvent);
    };

    const reset = () => { scoreValue = 0; };

    const draw = () => {
      context.fillStyle = '#000';
      context.font = '20px Verdana';
      context.fillText(`Score : ${scoreValue}`, 10, canvas.height - 20);
    };

    return {
      draw,
      get,
      plus,
      reset,
    };
  })();

  // Bird
  class Bird extends Sprite {
    reset() {
      this.x = 5;
      this.y = 150;
    }

    moveUp() {
      // Don't allow the bird to go any higher than the top.
      if (this.y > 25) {
        this.y -= 25;
      }
      document.dispatchEvent(birdMovedUp);
    }

    applyGravity() {
      this.y += gravity;
    }
  }

  class PipePair {
    static getPipeBottomOffset(yVal) {
      return yVal + images.get('pipeTop').height + pipeGap;
    }

    constructor(x, y) {
      this.top = new Sprite(x, y, images.get('pipeTop'));

      this.bottom = new Sprite(
        x,
        PipePair.getPipeBottomOffset(y),
        images.get('pipeBottom'),
      );
    }

    draw() {
      this.top.draw();
      this.bottom.draw();
    }

    move() {
      this.top.x -= 1;
      this.bottom.x = this.top.x;
    }
  }

  // List of pipes.
  const createPipes = () => {
    let pipeList;
    const positionForNewPipe = 50;

    const isFirstPipeOffScreen = () => {
      // TODO: Make this DRY
      const pipeBack = pipeList[0].top.x + pipeList[0].top.width;
      return pipeBack < 0;
    };

    const removeFirstPipe = () => {
      pipeList[0] = null;
      pipeList.shift();
      document.dispatchEvent(pipeRemovedEvent);
    };

    const needNewPipe = () => pipeList[0].top.x === positionForNewPipe;

    const randomY = () => Math.floor(Math.random()
      * images.get('pipeTop').height)
      - images.get('pipeTop').height;

    // Adds a pipe to the list of pipes at vertical position y.
    // The 'x' value is always set to the width of the canvas so pipes start
    // appearing at the right edge of the canvas.
    const addPipeToList = (y) => {
      pipeList.push(new PipePair(canvas.width, y));
    };

    const update = () => {
      if (isFirstPipeOffScreen()) {
        removeFirstPipe();
      }

      if (needNewPipe()) {
        addPipeToList(randomY());
      }
    };

    const reset = () => {
      pipeList = [];
      addPipeToList(0);
    };

    const getPipe = i => pipeList[i];

    function forEach(callback) {
      pipeList.forEach(callback);
    }

    return {
      forEach,
      getPipe,
      update,
      reset,
    };
  };

  // Resets the entire game.
  const reset = () => {
    score.reset();
    bird.reset();
    pipes.reset();
  };

  // See https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
  // Expects both obj1 and obj2 to have an x, y, height, and width.
  const detectCollision = (obj1, obj2) => obj1.x < obj2.x + obj2.width
    && obj1.x + obj1.width > obj2.x && obj1.y < obj2.y + obj2.height
    && obj1.y + obj1.height > obj2.y;

  const detectForegroundCollision = () => {
    if (detectCollision(bird, foreground)) {
      return true;
    }

    return false;
  };

  const detectPipeCollision = () => {
    const pipePair = pipes.getPipe(0);

    // Top pipe
    if (detectCollision(bird, pipePair.top)) {
      return true;
    }

    // Bottom pipe
    if (detectCollision(bird, pipePair.bottom)) {
      return true;
    }

    return false;
  };

  // Sets up the game.
  const setup = () => {
    background = new Sprite(0, 0, images.get('background'));

    pipes = createPipes();

    foreground = new Sprite(
      0,
      canvas.height - images.get('foreground').height,
      images.get('foreground'),
    );

    bird = new Bird(0, 150, images.get('bird'), sounds.fly);

    // Move the bird up with any key press.
    document.addEventListener('keydown', () => bird.moveUp());

    // Increment the score when a pipe is removed.
    document.addEventListener('pipeRemoved', () => score.plus());

    // Play the score sound when the user scores.
    document.addEventListener('scored', () => sounds.score.play());

    // Play the "wings flapping" sound when the user scores.
    document.addEventListener('birdMovedUp', () => sounds.fly.play());
  };

  const play = () => {
    background.draw();

    pipes.forEach((element) => {
      element.move();
      element.draw();
    });
    pipes.update();

    foreground.draw();

    bird.applyGravity();
    bird.draw();

    if (detectPipeCollision()) {
      reset();
    }

    if (detectForegroundCollision()) {
      reset();
    }

    score.draw();

    requestAnimationFrame(play);
  };

  const start = async () => {
    await images.ready();

    setup();
    reset();
    play();
  };

  return {
    start,
  };
})();

flappyBird.start();
