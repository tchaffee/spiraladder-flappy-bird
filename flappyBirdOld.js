var cvs = document.getElementById("canvas");
var ctx = cvs.getContext("2d");

// some variables

var gap = 85;
var constant;

var bX = 10;
var bY = 150;

var gravity = 1.5;

var score = 0;

// audio files

var fly = new Audio();
var scor = new Audio();

fly.src = "sounds/fly.mp3";
scor.src = "sounds/score.mp3";

// on key down

document.addEventListener("keydown",moveUp);

function moveUp(){
    bY -= 25;
    fly.play();
}

// pipe coordinates

var pipe = [];

pipe[0] = {
    x : cvs.width,
    y : 0
};

let getImage = (function (name) {
  let imagesLoaded = false;
  let images = {};

  return function returnImage(name) {
    if (! imagesLoaded) {
      loadImages();
    }

    return images[name];

  }

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

})();

// draw images

function drawPipes() {
  for(var i = 0; i < pipe.length; i++){

    constant = getImage('pipeNorth').height+gap;
    ctx.drawImage(getImage('pipeNorth'),pipe[i].x,pipe[i].y);
    ctx.drawImage(getImage('pipeSouth'),pipe[i].x,pipe[i].y+constant);
         
    pipe[i].x--;
    
    if( pipe[i].x == 125 ){
        pipe.push({
            x : cvs.width,
            y : Math.floor(Math.random()*getImage('pipeNorth').height)-getImage('pipeNorth').height
        }); 
    }
  }  
}

function draw1() {
  ctx.drawImage(getImage('bg'), 0, 0);

  drawPipes();

  ctx.drawImage(getImage('fg'),0,cvs.height - getImage('fg').height);
    
  ctx.drawImage(getImage('bird'),bX,bY);
  
}

function draw(){
    
    ctx.drawImage(getImage('bg'), 0, 0);
        
    for(var i = 0; i < pipe.length; i++){
        
        constant = getImage('pipeNorth').height+gap;
        ctx.drawImage(getImage('pipeNorth'),pipe[i].x,pipe[i].y);
        ctx.drawImage(getImage('pipeSouth'),pipe[i].x,pipe[i].y+constant);
             
        pipe[i].x--;
        
        if( pipe[i].x == 125 ){
            pipe.push({
                x : cvs.width,
                y : Math.floor(Math.random()*getImage('pipeNorth').height)-getImage('pipeNorth').height
            }); 
        }

        // detect collision
        
        if( bX + getImage('bird').width >= pipe[i].x && bX <= pipe[i].x + getImage('pipeNorth').width && (bY <= pipe[i].y + getImage('pipeNorth').height || bY+getImage('bird').height >= pipe[i].y+constant) || bY + getImage('bird').height >=  cvs.height - getImage('fg').height){
            location.reload(); // reload the page
        }
        
        if(pipe[i].x == 5){
            score++;
            scor.play();
        }
        
    }

    ctx.drawImage(getImage('fg'),0,cvs.height - getImage('fg').height);
    
    ctx.drawImage(getImage('bird'),bX,bY);
    
    bY += gravity;
    
    ctx.fillStyle = "#000";
    ctx.font = "20px Verdana";
    ctx.fillText("Score : "+score,10,cvs.height-20);
    
    requestAnimationFrame(draw);
    
}

draw1();
requestAnimationFrame(draw1);