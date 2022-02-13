const ui = {};
const game = {};
const snake = {};
// cell states are 0: empty, 1: snake, 2: food

var gameState = 0;
const RESET = 0; const PLAYING = 1; const PAUSED = 2; const WON = 3; const LOST = 4;

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  
  snake.cells = [new Pair(0, 0)];
  resetGame(24, 10);
  let numCells = game.columns * game.rows;
  game.foodValue = ceil(1.3028 * log(numCells) - 5);
  if (game.foodValue <= 0) game.foodValue = 1;
  setGameSpeed(floor(sqrt(numCells / 20) + 1));
  game.highscore = 0;

  ui.gridCol = color(0);
  ui.borderCol = color(128);
  ui.menuCol = color(0);
  ui.snakeCol1 = color(0, 200, 0);
  ui.snakeCol2 = color(0, 180, 0);
  ui.foodCol = color(255, 25, 10);

  ui.menuFont = loadFont("data/CONSOLA.TTF");
  textFont(ui.menuFont);

  resizeUI();
  createUIElements();
}

function draw() {
  background(ui.borderCol);

  if (gameState == PLAYING) {
    game.framesSinceLastMove ++;
    if (game.framesSinceLastMove >= game.framesPerMove) {
      update();
      game.framesSinceLastMove = 0;
    }
  }

  //draw border and menu
  noStroke();
  fill(ui.menuCol);
  rect(ui.menuX, ui.menuY, ui.menuW, ui.menuH);

  if (gameState == RESET) {
    ui.settings();
    ui.startText();
  }

  // win/loss screens
  switch (gameState) {
    case PAUSED:
      ui.startText();
      break;
    case WON:
      ui.win();
      break;
    case LOST:
      ui.loss();
      break;
  }
  if (gameState == WON || gameState == LOST) {
    ui.resetText();
  }

  ui.score();

  // draw grid;
  push();
  translate(ui.gridX, ui.gridY);

  noStroke();
  fill(ui.gridCol);
  rect(0, 0, ui.gridW, ui.gridH);

  stroke(63);
  strokeWeight(1);
  for (let x = ui.cellW; x < ui.gridW; x += ui.cellW) 
    line(x, 0, x, ui.gridH);
  for (let y = ui.cellW; y < ui.gridH; y += ui.cellW) 
    line(0, y, ui.gridW, y);

  noStroke();
  ellipseMode(CORNER)

  // food
  if (!game.won) {
    fill(ui.foodCol);
    ellipse(game.foodX * ui.cellW + ui.cellW / 10, game.foodY * ui.cellW + ui.cellW / 10, ui.cellW * 0.8, ui.cellW * 0.8);
  }

  // snake
  for (let i = 0; i < snake.cells.length; i++) {
    let x = snake.cells[i].x
    let y = snake.cells[i].y;
    // central part
    let col = ((snake.cells.length - i) % 2) ? color(ui.snakeCol1) : color(ui.snakeCol1);
    fill(col);
    ellipse(x * ui.cellW + ui.cellW / 10, y * ui.cellW + ui.cellW / 10, ui.cellW * 0.8, ui.cellW * 0.8);
    let link1 = 4;
    let link2 = 4;
    if (snake.cells.length > 1) {
      if (i == 0) {
        link1 = linkDirection(snake.cells[i].x, snake.cells[i].y, snake.cells[i+1].x, snake.cells[i+1].y);
      } else if (i == snake.cells.length - 1) { // draw head
        link1 = linkDirection(snake.cells[i].x, snake.cells[i].y, snake.cells[i-1].x, snake.cells[i-1].y);
        
      } else {
        link1 = linkDirection(snake.cells[i].x, snake.cells[i].y, snake.cells[i+1].x, snake.cells[i+1].y);
        link2 = linkDirection(snake.cells[i].x, snake.cells[i].y, snake.cells[i-1].x, snake.cells[i-1].y);
      }
    }
    // linking parts
    if (link1 == 0 || link2 == 0) 
      rect((x + 0.5) * ui.cellW, y * ui.cellW + ui.cellW / 10, ui.cellW / 2, ui.cellW * 0.8);
    if (link1 == 2 || link2 == 2) 
      rect(x * ui.cellW, y * ui.cellW + ui.cellW / 10, ui.cellW / 2, ui.cellW * 0.8);
    if (link1 == 1 || link2 == 1) 
      rect(x * ui.cellW + ui.cellW / 10, y * ui.cellW + ui.cellW / 2, ui.cellW * 0.8, ui.cellW / 2 + 1);
    if (link1 == 3 || link2 == 3) 
      rect(x * ui.cellW + ui.cellW / 10, y * ui.cellW, ui.cellW * 0.8, ui.cellW / 2);
    
  }
  // head
  push();
  translate(snake.headX * ui.cellW + ui.cellW / 2, snake.headY * ui.cellW + ui.cellW / 2);
  rotate(HALF_PI * snake.direction);
  ellipseMode(CENTER);
  noStroke();

  // tongue
  fill(255, 0, 0);
  beginShape();
  vertex(ui.point * 2, -ui.point);
  vertex(ui.point * 6, -ui.point);
  vertex(ui.point * 5, 0);
  vertex(ui.point * 6, ui.point);
  vertex(ui.point * 2, ui.point);
  endShape(CLOSE);

  // head
  fill(ui.snakeCol1);
  ellipse(0, 0, ui.cellW * 0.8, ui.cellW * 0.8);

  // eyes
  fill(255);
  stroke(ui.snakeCol1);
  strokeWeight(ui.point / 2);
  ellipse(ui.point / 2, -ui.point * 1.5, ui.point * 3, ui.point * 3);
  ellipse(ui.point / 2, ui.point * 1.5, ui.point * 3, ui.point * 3);

  fill(0);
  noStroke();
  ellipse(ui.point, -ui.point * 1.5, ui.point, ui.point);
  ellipse(ui.point, ui.point * 1.5, ui.point, ui.point);

  pop();
  pop();
}

function windowResized() { resizeUI(); }

function mousePressed() { // 5, 90, 230, 420
  if (gameState == WON || gameState == LOST) {
    resetGame(game.columns, game.rows);
  }
  if (gameState == RESET) {
    if (mouseX >= ui.menuX + ui.point && mouseX <= ui.menuX + ui.point * 3) {
      if (mouseY >= ui.menuY && mouseY <= ui.menuY + ui.menuH / 2) {
        resetGame(game.columns + 1, game.rows);
      } else if (game.columns > 1) {
        resetGame(game.columns - 1, game.rows);
      }
    }
    if (mouseX > ui.menuX + ui.point * 19 && mouseX < ui.menuX + ui.point * 21) {
      if (mouseY >= ui.menuY && mouseY <= ui.menuY + ui.menuH / 2) {
        resetGame(game.columns, game.rows + 1);
      } else if (game.rows > 1) {
        resetGame(game.columns, game.rows - 1);
      }
    }
    if (mouseX > ui.menuX + ui.point * 45 && mouseX < ui.menuX + ui.point * 47) {
      if (mouseY >= ui.menuY && mouseY <= ui.menuY + ui.menuH / 2) {
        if (game.speed < 60) setGameSpeed(game.speed + 1);
      } else if (game.speed > 1) {
        setGameSpeed(game.speed - 1);
      }
    }
    if (mouseX > ui.menuX + ui.point * 85 && mouseX < ui.menuX + ui.point * 87) {
      if (mouseY >= ui.menuY && mouseY <= ui.menuY + ui.menuH / 2) {
        game.foodValue++;
      } else if (game.foodValue > 1) {
        game.foodValue--;
      }
    }
  }
}

function keyPressed() {
  if ((gameState == RESET || gameState == PAUSED) && (keyCode == RIGHT_ARROW || keyCode == DOWN_ARROW || keyCode == LEFT_ARROW || keyCode == UP_ARROW)) {
    gameState = PLAYING;
    game.framesSinceLastMove = 10000;
  } else if (gameState == WON || gameState == LOST) {
    resetGame(game.columns, game.rows);
  }

  if (gameState == PLAYING) {
    if (keyCode == RIGHT_ARROW || keyCode == DOWN_ARROW || keyCode == LEFT_ARROW || keyCode == UP_ARROW) {
      if (game.inputs.length > 0) {
        game.lastInput = game.inputs[game.inputs.length - 1];
      } else {
        game.lastInput = snake.direction;
      }
      
      if(keyCode==RIGHT_ARROW && game.lastInput != 0 && (game.lastInput != 2 || snake.cells.length < 3)){
        game.inputs.push(0);
      } else if(keyCode==DOWN_ARROW && game.lastInput != 1 && (game.lastInput != 3 || snake.cells.length < 3)){
        game.inputs.push(1);
      } else if(keyCode==LEFT_ARROW && game.lastInput != 2 && (game.lastInput !=0 || snake.cells.length < 3)){
        game.inputs.push(2);
      } else if(keyCode==UP_ARROW && game.lastInput != 3 && (game.lastInput != 1 || snake.cells.length < 3)){
        game.inputs.push(3);
      } else {
        game.inputs.push(game.lastInput);
      }
    } else if (keyCode == BACKSPACE) {
      gameState = PAUSED;
    }
  }
}

function resizeUI() {
  ui.width = windowWidth;
  ui.margin = 20;
  
  ui.menuX = ui.margin;
  ui.menuY = ui.margin;
  ui.menuW = ui.width - ui.margin * 2;
  ui.menuH = (windowWidth - ui.margin * 2) / 24;
  ui.point = ui.menuH / 8;
  
  ui.settingsTextSize = ui.point * 5;
  ui.scoreTextSize = ui.point * 5;
  ui.lengthTextSize = ui.point * 3;
  ui.gameOverTextSize = ui.point * 7;

  createUIElements();

  resizeGrid();
  resizeCanvas(windowWidth, windowHeight);
}

function resetGame(c, r) {
  gameState = RESET;

  game.columns = c;
  game.rows = r;

  game.score = 0;

  game.inputs = new Array();
  game.lastInput;

  game.grid = new Array();
  for (let x = 0; x < game.columns; x++) {
    game.grid.push([0]);
    for (let y = 0; y < game.rows - 1; y++) {
      game.grid[x].push(0);
    }
  }

  resetSnake();

  game.foodX = 0;
  game.foodY = 0;
  spawnFood();

  resizeGrid();
}

function resizeGrid() {
  let marginsAndMenu = ui.margin * 3 + ui.menuH;
  let gridW = ui.width - ui.margin * 2;

  ui.cellW = floor(gridW / game.columns);
  if (marginsAndMenu + ui.cellW * game.rows > windowHeight) {
    ui.cellW = floor((windowHeight - marginsAndMenu) / game.rows);
  }
  ui.gridW = ui.cellW * game.columns;
  ui.gridH = ui.cellW * game.rows;
  ui.height = windowHeight;

  ui.gridX = (ui.width - ui.gridW) / 2;
  ui.gridY = ui.margin * 2 + ui.menuH;
}

function setGameSpeed(speed) {
  game.speed = speed;
  game.framesPerMove = floor(60 / (game.speed + 1));
  game.framesSinceLastMove = 10000;
}

function resetSnake() {
  snake.headX = int(game.columns / 2);
  snake.headY = int(game.rows / 2);
  snake.length = 1;
  snake.direction = 4;
  snake.prevDirection = 4;
  game.grid[snake.headX][snake.headY] = 1;
  
  snake.cells = new Array();
  snake.cells.push(new Pair(snake.headX, snake.headY));
}

function spawnFood() {
  if(snake.length >= game.columns * game.rows){
    return;
  }
  let foodPlaced=false;
  while(!foodPlaced){
    let c = floor(random(0, game.columns));
    let r = floor(random(0, game.rows));
    if(game.grid[c][r] == 0) {
      game.grid[c][r] = 2;
      game.foodX = c;
      game.foodY = r;
      foodPlaced = true;
    }
  }
}

function update() {
  // move head
  if(game.inputs.length > 0){
    snake.direction = game.inputs[0];
    game.inputs.shift();
  }
  switch (snake.direction) {
    case 0: snake.headX++; break;
    case 1: snake.headY++; break;
    case 2: snake.headX--; break;
    case 3: snake.headY--; break;
  }

  // check if out of bounds
  if (snakeOutOfBounds()) {
    gameLost();
    snake.headX = snake.cells[snake.cells.length-1].x;
    snake.headY = snake.cells[snake.cells.length-1].y;
  } else {
    snake.cells.push(new Pair(snake.headX, snake.headY));

    // eat food
    if (game.grid[snake.headX][snake.headY] == 2) {
      snake.length += game.foodValue;
      game.score++;
      if (game.columns * game.rows <= snake.cells.length) {
        gameWon();
      } else spawnFood();
    }
    
    // remove excess cells
    if (snake.cells.length > snake.length) {
      let lastCell = snake.cells.shift();
      game.grid[lastCell.x][lastCell.y] = 0;
    }
    // check if new head position is occupied
    if (game.grid[snake.headX][snake.headY] == 1) {
      gameLost();
    }

    // change cell at new head position to snake
    game.grid[snake.headX][snake.headY] = 1;
  }
}

function snakeOutOfBounds() {
  //outOfBounds
  return (snake.headX < 0 || snake.headX >= game.columns || snake.headY < 0 || snake.headY >= game.rows);
}

function gameLost() {
  gameState = LOST;
  if (game.score > game.highscore) game.highscore = game.score;
}

function gameWon() {
  gameState = WON;
  if (game.score > game.highscore) game.highscore = game.score;
}

class Pair {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

function createUIElements () {
  let pt = ui.point;

  ui.settingArrows = function(x) {
    fill(0, 255, 0);
    noStroke();
    let y = ui.menuH / 7;
    let w = pt * 2;
    let h = ui.menuH * 2 / 7;
    triangle(x, y + h, x + w / 2, y, x + w, y + h);
    y = ui.menuH * 4 / 7;
    triangle(x, y, x + w, y, x + w / 2, y + h);
  }

  ui.settings = function() {
    push();
    translate(ui.menuX, ui.menuY);
    textSize(ui.settingsTextSize);
    textAlign(CENTER);
    
    // columns / rows
    ui.settingArrows(pt);
    ui.settingArrows(pt * 19);
    fill(255);
    text(nf(game.columns, 2) + "x" + nf(game.rows, 2), pt * 11, pt * 5.5);

    // speed
    fill(255);
    text('Speed:' + game.speed, pt * 34, pt * 5.5);
    ui.settingArrows(pt * 45);

    // food value
    fill(255);
    text('Food value:' + game.foodValue, pt * 67, pt * 5.5);
    ui.settingArrows(pt * 85);
    
    pop();
  }

  ui.startText = function() {
    push();
    translate(ui.menuX, ui.menuY);
    
    let x = 0;
    let y = 0;

    if (gameState == RESET) {
      textSize(ui.settingsTextSize)
      textAlign(CORNER);
      x = pt * 89;
      y = pt * 5.5;
      fill(180);
    } else if (gameState == PAUSED) {
      textSize(ui.gameOverTextSize);
      textAlign(CORNER);
      x = pt;
      y = pt * 6.5;
      fill(255);
    }

    text("Press arrow keys to play", x, y);
    pop();
  }
  
  ui.resetText = function() {
    fill(127);
    textSize(ui.lengthTextSize);
    textAlign(CORNER);
    text("Press any button to reset", ui.menuX + pt, ui.menuY + pt * 5);
  }

  ui.score = function() {
    push();
    translate(ui.menuX, ui.menuY);
    textAlign(CORNER);
    fill(127, 255, 255);

    let scoreText = "Highscore: " + game.highscore;
    if (gameState == RESET) {
      textSize(ui.settingsTextSize);
      text(scoreText, ui.menuW - pt - textWidth(scoreText), pt * 5.5);
    } else {
      scoreText = "Score: " + game.score + " | " + scoreText;
      textSize(ui.scoreTextSize);
      let scoreTextWidth = textWidth(scoreText);
      text(scoreText, ui.menuW - 5 - scoreTextWidth, pt * 4);

      textSize(12);
      let lengthText = "Length: " + snake.length;
      text(lengthText, ui.menuW - 5 - scoreTextWidth, pt * 7);
    }
    pop();
  }

  ui.win = function() {
    push();
    translate(ui.menuX, ui.menuY);
    textAlign(CENTER);
    fill(0, 255, 0);
    textSize(ui.gameOverTextSize);
    text("Game Complete!", ui.menuW / 2, pt * 6.5);
    pop();
  }

  ui.loss = function() {
    push();
    translate(ui.menuX, ui.menuY);
    textAlign(CENTER);
    fill(255, 0, 0);
    textSize(ui.gameOverTextSize);
    text("Game Over!", ui.menuW / 2, pt * 6.5);
    pop();
  }
}

function linkDirection(x1, y1, x2, y2) {
  if (x1 > x2) {
    return 2;
  } else if (x1 < x2) {
    return 0;
  } else if (y1 < y2) {
    return 1;
  } else {
    return 3;
  }
}