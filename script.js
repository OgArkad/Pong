let pongScreen = document.getElementById("pongScreen");
let scoreDisplay = document.getElementById("score");
let clicked = "PvPButton";
let PvPButton = document.getElementById("PvPButton");
let PvPOnlineButton = document.getElementById("PvPOnlineButton");
let PvBButton = document.getElementById("PvBButton");

let leftSideCoordinate = [12, 13, 14, 15, 16, 17, 18, 19];
let rightSideCoordinate = [12, 13, 14, 15, 16, 17, 18, 19];

const keys = { KeyW: false, KeyS: false, ArrowUp: false, ArrowDown: false };

let ballXCoor = 15;
let ballYCoor = 15;
let ballDirX = 1;
let ballDirY = 0;
let ballSpeed = 1; 
let points = [0, 0];
let ballTimer;
let botInterval = null;
let targetSideY = 12; 

PvBButton.addEventListener('click', function () {
    clicked = "PvBButton";
    startBot();
});
PvPButton.addEventListener('click', function () {
    clicked = "PvPButton";
    stopBot();
});

document.addEventListener('keydown', (event) => {
    if (event.code in keys) keys[event.code] = true;
    if (keys.KeyW) leftMoveUp();
    if (keys.KeyS) leftMoveDown();
    if (clicked !== "PvBButton") {
        if (keys.ArrowUp) rightMoveUp();
        if (keys.ArrowDown) rightMoveDown();
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code in keys) keys[event.code] = false;
});

function moveSide(coordinates, x, delta) {
    if ((delta === -1 && coordinates[0] <= 0) || (delta === 1 && coordinates[coordinates.length - 1] >= 31)) return;

    coordinates.forEach(y => {
        let block = pongScreen.querySelector(`div[data-x="${x}"][data-y="${y}"]`);
        if (block) block.className = "black";
    });

    for (let i = 0; i < coordinates.length; i++) coordinates[i] += delta;

    coordinates.forEach(y => {
        let block = pongScreen.querySelector(`div[data-x="${x}"][data-y="${y}"]`);
        if (block) block.className = "white";
    });
}

function leftMoveUp() { moveSide(leftSideCoordinate, 0, -1); }
function leftMoveDown() { moveSide(leftSideCoordinate, 0, 1); }
function rightMoveUp() { moveSide(rightSideCoordinate, 31, -1); }
function rightMoveDown() { moveSide(rightSideCoordinate, 31, 1); }

for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
        let block = document.createElement("div");
        block.dataset.x = x;
        block.dataset.y = y;
        
        let isBall = x === 15 && y === 15;
        let isSide = (x === 0 || x === 31) && y > 11 && y < 20;
        block.className = (isBall || isSide) ? "white" : "black";

        pongScreen.appendChild(block);
    }
}

function applySidePhysics(hitIndex) {
    if (hitIndex === 0) { ballSpeed = 3.00; ballDirY = -1; }
    else if (hitIndex === 1) { ballSpeed = 2.75; ballDirY = -1; }
    else if (hitIndex >= 2 && hitIndex <= 5) { ballSpeed = 1.0; ballDirY = 0; }
    else if (hitIndex === 6) { ballSpeed = 2.75; ballDirY = 1; }
    else if (hitIndex === 7) { ballSpeed = 3.00; ballDirY = 1; }
}

function updateBall() {
    let oldBlock = pongScreen.querySelector(`div[data-x="${ballXCoor}"][data-y="${ballYCoor}"]`);
    if (oldBlock) oldBlock.className = "black";

    let nextX = ballXCoor + ballDirX;
    let nextY = ballYCoor + ballDirY;

    if (nextY < 0 || nextY > 31) {
        ballDirY *= -1;
        nextY = ballYCoor + ballDirY;
    }

    if (nextX <= 0) {
        let hitIndex = leftSideCoordinate.indexOf(nextY);
        if (hitIndex !== -1) {
            ballDirX = 1;
            applySidePhysics(hitIndex);
            nextX = 1;
        } else {
            points[1] += 1;
            return resetBall();
        }
    } else if (nextX >= 31) {
        let hitIndex = rightSideCoordinate.indexOf(nextY);
        if (hitIndex !== -1) {
            ballDirX = -1;
            applySidePhysics(hitIndex);
            nextX = 30;
        } else {
            points[0] += 1;
            return resetBall();
        }
    }

    ballXCoor = nextX;
    ballYCoor = nextY;

    let newBlock = pongScreen.querySelector(`div[data-x="${ballXCoor}"][data-y="${ballYCoor}"]`);
    if (newBlock) newBlock.className = "white";

    ballTimer = setTimeout(updateBall, 100 / ballSpeed);
}

function resetBall() {
    scoreDisplay.textContent = `${points[0]} - ${points[1]}`;

    let oldBlock = pongScreen.querySelector(`div[data-x="${ballXCoor}"][data-y="${ballYCoor}"]`);
    if (oldBlock) oldBlock.className = "black";

    ballXCoor = 15;
    ballYCoor = 15;
    ballDirY = 0;
    ballSpeed = 1;
    ballDirX = Math.random() > 0.5 ? 1 : -1;
    
    let centerBlock = pongScreen.querySelector(`div[data-x="${ballXCoor}"][data-y="${ballYCoor}"]`);
    if (centerBlock) centerBlock.className = "white";

    clearTimeout(ballTimer);
    ballTimer = setTimeout(updateBall, 100 / ballSpeed);
}

function calculateBotStrategy() {
    if (ballDirX === 1) {
        let simX = ballXCoor;
        let simY = ballYCoor;
        let simDirY = ballDirY;

        while (simX < 31) {
            simX++;
            simY += simDirY;
            if (simY <= 0 || simY >= 31) simDirY *= -1;
        }

        let playerCenter = leftSideCoordinate[0] + 3.5;
        let distToTop = Math.abs(playerCenter - 0);
        let distToBottom = Math.abs(playerCenter - 31);
        let farthestPointY = distToTop > distToBottom ? 0 : 31;

        let bestHitIndex = 3;
        if (farthestPointY === 0) bestHitIndex = 0;       
        else if (farthestPointY === 31) bestHitIndex = 7; 

        targetSideY = Math.max(0, Math.min(24, simY - bestHitIndex));
    } else {
        targetSideY = 12; 
    }
}

function startBot() {
    stopBot();
    botInterval = setInterval(() => {
        calculateBotStrategy();
        let currentBotY = rightSideCoordinate[0];
        if (currentBotY < targetSideY) {
            rightMoveDown();
        } else if (currentBotY > targetSideY) {
            rightMoveUp();
        }
    }, 100);
}

function stopBot() {
    if (botInterval) clearInterval(botInterval);
}

resetBall();
