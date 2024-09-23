// 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 게임 오버 화면 요소
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const highScoreElement = document.getElementById('highScore');
const restartButton = document.getElementById('restartButton');

// 시작 화면 요소
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');

// 게임 변수 설정
let lastTime = 0; // 이전 프레임 시간
let gameState = 'start'; // 'start', 'playing', 'gameover'
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let currentBackground = 'day'; // 'day' 또는 'night'

// 최고 점수 초기화
highScoreElement.textContent = highScore;

// 사운드 로드
const sounds = {
    flap: new Audio('music/flap.wav'),
    hit: new Audio('music/hit.wav'),
    score: new Audio('music/score.wav'),
    gameSound: new Audio('music/Flying Through the Sky.wav')
};

// 배경 음악 루프 설정
sounds.gameSound.loop = true;

// 이미지 로드
const images = {
    backgroundDay: new Image(),
    backgroundNight: new Image(),
    bird: new Image(),
    bird2: new Image(), // bird2.png 준비 완료
    pipeTop: new Image(),
    pipeBottom: new Image()
};

// 이미지 소스 설정
images.backgroundDay.src = 'images/backgroundDay.png';
images.backgroundNight.src = 'images/backgroundNight.png';
images.bird.src = 'images/bird.png';
images.bird2.src = 'images/bird2.png'; // 새의 날개짓 애니메이션 이미지
images.pipeTop.src = 'images/pipeTop.png';
images.pipeBottom.src = 'images/pipeBottom.png';

// 이미지 로드 완료 확인
let imagesLoaded = 0;
const totalImages = Object.keys(images).length;

for (let key in images) {
    images[key].onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            // 모든 이미지가 로드된 후 추가 작업 가능
        }
    };
}

// 새 클래스 정의
class Bird {
    constructor() {
        this.x = 50;
        this.y = canvas.height / 2;
        this.width = 34; // 이미지 너비에 맞게 조절
        this.height = 24; // 이미지 높이에 맞게 조절
        this.gravity = 800; // 픽셀/초² 단위
        this.lift = -300; // 픽셀/초 단위
        this.velocity = 0;
        this.flapping = false; // 새가 날개짓 중인지 여부
    }

    draw() {
        if (this.flapping) {
            // 새가 날개짓 중일 때 bird2.png 사용
            ctx.drawImage(images.bird2, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        } else {
            // 평소에는 bird.png 사용
            ctx.drawImage(images.bird, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
    }

    update(deltaTime) {
        this.velocity += this.gravity * deltaTime;
        this.y += this.velocity * deltaTime;

        // 바닥 또는 천장 충돌 감지
        if (this.y + this.height / 2 >= canvas.height || this.y - this.height / 2 <= 0) {
            gameOver();
        }
    }

    flap() {
        this.velocity = this.lift;
        this.flapping = true;
        setTimeout(() => {
            this.flapping = false;
        }, 100); // 날개짓 상태 지속 시간 (100ms)

        // flap.wav 재생
        sounds.flap.currentTime = 0;
        sounds.flap.play();
    }

    reset() {
        this.y = canvas.height / 2;
        this.velocity = 0;
        this.flapping = false;
    }
}

// 파이프 클래스 정의
class Pipe {
    constructor() {
        this.x = canvas.width;
        this.width = 52; // 파이프 이미지 너비에 맞게 조절
        this.gap = 120;
        this.speed = 200; // 픽셀/초 단위
        this.top = Math.floor(Math.random() * (canvas.height / 2)) + 20;
        this.bottom = this.top + this.gap;
        this.counted = false;
    }

    draw() {
        // 위쪽 파이프
        ctx.drawImage(images.pipeTop, this.x, this.top - images.pipeTop.height, this.width, images.pipeTop.height);
        // 아래쪽 파이프
        ctx.drawImage(images.pipeBottom, this.x, this.bottom, this.width, images.pipeBottom.height);
    }

    update(deltaTime) {
        this.x -= this.speed * deltaTime;

        // 파이프가 화면을 벗어나면 제거
        if (this.x + this.width < 0) {
            pipes.shift();
        }

        // 점수 증가 및 배경 전환
        if (!this.counted && this.x + this.width < bird.x) {
            score++;
            this.counted = true;

            // 배경 전환
            if (score % 10 === 0) {
                currentBackground = currentBackground === 'day' ? 'night' : 'day';
            }

            // 최고 점수 업데이트
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
                highScoreElement.textContent = highScore;
            }

            // score.wav 재생 (10점마다)
            sounds.score.currentTime = 0;
            sounds.score.play();
        }

        // 충돌 감지
        if (
            (bird.x + bird.width / 2 > this.x && bird.x - bird.width / 2 < this.x + this.width) &&
            (bird.y - bird.height / 2 < this.top || bird.y + bird.height / 2 > this.bottom)
        ) {
            gameOver();
        }
    }
}

// 배경 그리기 함수
function drawBackground() {
    if (currentBackground === 'day') {
        ctx.drawImage(images.backgroundDay, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.drawImage(images.backgroundNight, 0, 0, canvas.width, canvas.height);
    }
}

// 인스턴스 생성
const bird = new Bird();
let pipes = [];

// 입력 이벤트 설정
document.addEventListener('keydown', function (e) {
    if (e.code === 'Space') {
        if (gameState === 'playing') {
            bird.flap();
        }
    }
});

// 클릭 이벤트와 터치 이벤트 모두 처리
canvas.addEventListener('click', handleInput);
canvas.addEventListener('touchstart', handleInput);

function handleInput(e) {
    e.preventDefault();
    if (gameState === 'playing') {
        bird.flap();
    }
}

// 시작 버튼 클릭 시 게임 시작
startButton.addEventListener('click', function () {
    startGame();
});

// 재시작 버튼 클릭 시 게임 재시작
restartButton.addEventListener('click', function () {
    startGame();
});

// 게임 루프 함수
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = (timestamp - lastTime) / 1000; // 초 단위
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 그리기
    drawBackground();

    if (gameState === 'playing') {
        bird.update(deltaTime);
        bird.draw();

        // 파이프 생성
        // 타임스탬프 기반으로 파이프 생성 간격 조절 (예: 1.5초마다)
        if (!bird.lastPipeTime) bird.lastPipeTime = 0;
        bird.lastPipeTime += deltaTime;
        if (bird.lastPipeTime > 1.5) { // 파이프 생성 간격: 1.5초
            pipes.push(new Pipe());
            bird.lastPipeTime = 0;
        }

        // 파이프 업데이트 및 그리기
        pipes.forEach(pipe => {
            pipe.update(deltaTime);
            pipe.draw();
        });

        // 점수 표시
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText(`점수: ${score}`, 10, 30);
    }

    requestAnimationFrame(gameLoop);
}

// 게임 시작 함수
function startGame() {
    gameState = 'playing';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    resetGame();

    // 배경 음악 재생
    sounds.gameSound.currentTime = 0;
    sounds.gameSound.play();
}

// 게임 오버 함수
function gameOver() {
    if (gameState !== 'gameover') {
        gameState = 'gameover';
        finalScoreElement.textContent = score;
        gameOverScreen.classList.remove('hidden');

        // 배경 음악 중지
        sounds.gameSound.pause();

        // hit.wav 재생
        sounds.hit.currentTime = 0;
        sounds.hit.play();
    }
}

// 게임 리셋 함수
function resetGame() {
    score = 0;
    lastTime = 0;
    pipes = [];
    bird.reset();
    currentBackground = 'day'; // 게임 리셋 시 배경을 낮으로 초기화
    bird.lastPipeTime = 0;
}

// 게임 루프 시작
requestAnimationFrame(gameLoop);
