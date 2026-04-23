"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

interface GameProps {
  userName: string;
  onQuit: () => void;
  onRestart: () => void;
}

const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_COLORS = {
  red: "#fca5a5",
  orange: "#fdba74",
  yellow: "#fde047",
  blue: "#93c5fd",
  green: "#86efac",
  purple: "#d8b4fe",
};

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isRed: boolean;
  status: 1 | 0;
}

interface LeaderboardEntry {
  name: string;
  time: string;
}

export default function Game({ userName, onQuit, onRestart }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [gameState, setGameState] = useState<"countdown" | "playing" | "paused" | "win" | "fail">("countdown");
  const [countdown, setCountdown] = useState(3);
  const [lives, setLives] = useState(3);
  const [time, setTime] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Game specific refs (mutable state for animation loop)
  const reqRef = useRef<number>(0);
  const timeRef = useRef<number>(Date.now());
  
  const paddle = useRef({ x: 0, width: 100, height: 12, speed: 7, dx: 0 });
  const ball = useRef({ x: 0, y: 0, radius: 8, dx: 4, dy: -4, speed: 5 });
  const bricks = useRef<Brick[][]>([]);
  const redDestroyed = useRef(0);
  const [redDestroyedState, setRedDestroyedState] = useState(0);

  // Audio Context for beep
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Game
  useEffect(() => {
    initBricks();
    resetBallAndPaddle();
    
    // Background music setup
    audioRef.current = new Audio("/Hyper_Speed_Run.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.1; // "볼륨이 너무 크지 않도록 설정"

    // Set Audio context for beeps
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioCtxRef.current = new AudioContext();
    }

    return () => {
      cancelAnimationFrame(reqRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const initBricks = () => {
    const totalBricks = BRICK_ROWS * BRICK_COLS;
    const redCount = Math.floor(totalBricks * 0.3); // 12 bricks
    const otherColors = [BRICK_COLORS.orange, BRICK_COLORS.yellow, BRICK_COLORS.blue, BRICK_COLORS.green, BRICK_COLORS.purple];
    
    let colors = Array(redCount).fill(BRICK_COLORS.red);
    for (let i = 0; i < totalBricks - redCount; i++) {
      colors.push(otherColors[Math.floor(Math.random() * otherColors.length)]);
    }
    
    // Shuffle
    colors.sort(() => Math.random() - 0.5);

    let colorIdx = 0;
    const newBricks: Brick[][] = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      newBricks[r] = [];
      for (let c = 0; c < BRICK_COLS; c++) {
        const color = colors[colorIdx++];
        newBricks[r][c] = {
          x: 0, y: 0, width: 0, height: 20,
          color,
          isRed: color === BRICK_COLORS.red,
          status: 1
        };
      }
    }
    bricks.current = newBricks;
    redDestroyed.current = 0;
    setRedDestroyedState(0);
  };

  const resetBallAndPaddle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    paddle.current.width = Math.min(canvas.width / 4, 120);
    paddle.current.x = (canvas.width - paddle.current.width) / 2;
    
    ball.current.x = canvas.width / 2;
    ball.current.y = canvas.height - 30;
    
    // Randomize initial angle slightly
    const angle = Math.random() * Math.PI / 4 - Math.PI / 8; // -22.5 to 22.5 degrees
    const speed = ball.current.speed;
    ball.current.dx = speed * Math.sin(angle) * (Math.random() > 0.5 ? 1 : -1) || 4;
    ball.current.dy = -speed * Math.cos(angle) || -4;
  };

  const playBeep = () => {
    if (!audioCtxRef.current) return;
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    const oscillator = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(587.33, audioCtxRef.current.currentTime); // D5
    
    gainNode.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);
    
    oscillator.start();
    oscillator.stop(audioCtxRef.current.currentTime + 0.1);
  };

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === "playing") {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // Countdown logic
  useEffect(() => {
    if (gameState === "countdown") {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState("playing");
        // Start audio
        audioRef.current?.play().catch(e => console.log("Audio play failed:", e));
        timeRef.current = Date.now();
        reqRef.current = requestAnimationFrame(draw);
      }
    }
  }, [countdown, gameState]);

  // Submit Result
  const submitResult = async (finalTime: number) => {
    setIsSubmitting(true);
    try {
      const minutes = Math.floor(finalTime / 60);
      const seconds = finalTime % 60;
      const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      
      const params = new URLSearchParams();
      params.append('name', userName);
      params.append('time', formattedTime);
      params.append('action', 'submit');

      const url = "https://script.google.com/macros/s/AKfycbzvfwu0Hrw_UOqpEz00BKDgmKwo5evYEdAWP6qK03oH5Qmx2fjnwmm3bVe5u2nXvuIpwg/exec";
      
      // Simple POST request
      fetch(url, {
        method: "POST",
        body: params,
        mode: "no-cors"
      }).then(() => {
        // Since we can't read the response due to no-cors, we'll try a GET request to fetch Top3
        fetchLeaderboard();
      }).catch((err) => {
        console.error("Submission error", err);
        fetchLeaderboard();
      });
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const url = "https://script.google.com/macros/s/AKfycbzvfwu0Hrw_UOqpEz00BKDgmKwo5evYEdAWP6qK03oH5Qmx2fjnwmm3bVe5u2nXvuIpwg/exec?action=getTop3";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.top3) {
          setLeaderboard(data.top3);
        }
      }
    } catch (e) {
      console.log("Failed to fetch leaderboard", e);
    }
    setIsSubmitting(false);
  };

  const handleWin = () => {
    setGameState("win");
    cancelAnimationFrame(reqRef.current);
    if (audioRef.current) audioRef.current.pause();
    
    // Fireworks
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: [BRICK_COLORS.red, BRICK_COLORS.blue, BRICK_COLORS.yellow]
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: [BRICK_COLORS.red, BRICK_COLORS.blue, BRICK_COLORS.yellow]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Submit
    submitResult(time);
  };

  const handleFail = () => {
    setGameState("fail");
    cancelAnimationFrame(reqRef.current);
    if (audioRef.current) audioRef.current.pause();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") paddle.current.dx = paddle.current.speed;
      else if (e.key === "ArrowLeft") paddle.current.dx = -paddle.current.speed;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") paddle.current.dx = 0;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Touch controls
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== "playing" || !canvasRef.current) return;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const relativeX = touch.clientX - rect.left;
    if (relativeX > 0 && relativeX < canvasRef.current.width) {
      paddle.current.x = relativeX - paddle.current.width / 2;
    }
  };

  // Main Draw Loop
  const draw = () => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update dimensions dynamically if needed
    const bPadding = 10;
    const bOffsetTop = 50;
    const bOffsetLeft = 15;
    const bWidth = (canvas.width - (bOffsetLeft * 2) - (bPadding * (BRICK_COLS - 1))) / BRICK_COLS;
    
    // Draw Bricks
    let totalActive = 0;
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        const b = bricks.current[r][c];
        if (b.status === 1) {
          totalActive++;
          b.x = (c * (bWidth + bPadding)) + bOffsetLeft;
          b.y = (r * (b.height + bPadding)) + bOffsetTop;
          b.width = bWidth;

          ctx.beginPath();
          ctx.rect(b.x, b.y, b.width, b.height);
          ctx.fillStyle = b.color;
          ctx.fill();
          
          // Add a premium glass-like gloss effect
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.fillRect(b.x, b.y, b.width, b.height / 3);
          
          ctx.closePath();
        }
      }
    }

    // Draw Paddle
    ctx.beginPath();
    ctx.roundRect(paddle.current.x, canvas.height - paddle.current.height - 10, paddle.current.width, paddle.current.height, 6);
    ctx.fillStyle = "#a855f7"; // purple-500
    ctx.fill();
    ctx.closePath();

    // Draw Ball
    ctx.beginPath();
    ctx.arc(ball.current.x, ball.current.y, ball.current.radius, 0, Math.PI * 2);
    // Radial gradient for ball
    const gradient = ctx.createRadialGradient(
      ball.current.x - 2, ball.current.y - 2, 1, 
      ball.current.x, ball.current.y, ball.current.radius
    );
    gradient.addColorStop(0, "#fff");
    gradient.addColorStop(1, "#f472b6"); // pink-400
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.shadowColor = "#f472b6";
    ctx.shadowBlur = 10;
    ctx.closePath();
    ctx.shadowBlur = 0; // reset

    // Physics
    // Paddle movement
    paddle.current.x += paddle.current.dx;
    if (paddle.current.x < 0) paddle.current.x = 0;
    if (paddle.current.x + paddle.current.width > canvas.width) paddle.current.x = canvas.width - paddle.current.width;

    // Ball movement
    ball.current.x += ball.current.dx;
    ball.current.y += ball.current.dy;

    // Wall collision
    if (ball.current.x + ball.current.dx > canvas.width - ball.current.radius || ball.current.x + ball.current.dx < ball.current.radius) {
      ball.current.dx = -ball.current.dx;
    }
    if (ball.current.y + ball.current.dy < ball.current.radius) {
      ball.current.dy = -ball.current.dy;
    } else if (ball.current.y + ball.current.dy > canvas.height - ball.current.radius - 10 - paddle.current.height) {
      // Paddle collision
      if (ball.current.x > paddle.current.x && ball.current.x < paddle.current.x + paddle.current.width) {
        // Hit paddle
        ball.current.dy = -ball.current.dy;
        // Add a bit of english (angle change)
        const hitPoint = ball.current.x - (paddle.current.x + paddle.current.width / 2);
        ball.current.dx = hitPoint * 0.15;
      } else if (ball.current.y + ball.current.dy > canvas.height - ball.current.radius) {
        // Fall off
        setLives((prev) => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            handleFail();
          } else {
            resetBallAndPaddle();
          }
          return newLives;
        });
      }
    }

    // Brick collision
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        const b = bricks.current[r][c];
        if (b.status === 1) {
          if (
            ball.current.x > b.x &&
            ball.current.x < b.x + b.width &&
            ball.current.y > b.y &&
            ball.current.y < b.y + b.height
          ) {
            ball.current.dy = -ball.current.dy;
            b.status = 0;
            playBeep();
            
            if (b.isRed) {
              redDestroyed.current += 1;
              setRedDestroyedState(redDestroyed.current);
              if (redDestroyed.current >= 3) {
                handleWin();
                return;
              }
            }
          }
        }
      }
    }

    reqRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    if (gameState === "playing") {
      reqRef.current = requestAnimationFrame(draw);
    }
    return () => cancelAnimationFrame(reqRef.current);
  }, [gameState, lives]);

  const togglePause = () => {
    if (gameState === "playing") {
      setGameState("paused");
      if (audioRef.current) audioRef.current.pause();
    } else if (gameState === "paused") {
      setGameState("playing");
      if (audioRef.current) audioRef.current.play();
    }
  };

  const formattedTime = `${Math.floor(time / 60).toString().padStart(2, "0")}:${(time % 60).toString().padStart(2, "0")}`;

  return (
    <div className="w-full max-w-4xl flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-4 text-white glass-panel p-4 rounded-xl">
        <div className="flex gap-4 items-center">
          <span className="font-bold text-lg">사용자: {userName}</span>
          <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            빨간 블록: {redDestroyedState} / 3
          </span>
        </div>
        
        <div className="flex gap-6 items-center">
          <span className="text-xl font-mono tracking-widest text-indigo-300">{formattedTime}</span>
          <div className="flex gap-1">
            {Array(3).fill(0).map((_, i) => (
              <span key={i} className={`text-2xl ${i < lives ? 'text-pink-500' : 'text-slate-600'}`}>❤️</span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[4/3] max-h-[70vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
        {gameState === "countdown" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-pink-500 animate-bounce">
              {countdown}
            </div>
          </div>
        )}

        {gameState === "paused" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-md">
            <div className="text-4xl font-bold text-white tracking-widest">PAUSED</div>
          </div>
        )}

        {gameState === "fail" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-950/80 backdrop-blur-md">
            <h2 className="text-5xl font-black text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">게임 미션 실패</h2>
            <div className="flex gap-4">
              <button onClick={onRestart} className="px-6 py-3 bg-white text-red-900 rounded-xl font-bold hover:bg-red-100 transition">다시 시작</button>
              <button onClick={onQuit} className="px-6 py-3 bg-red-900/50 text-white rounded-xl font-bold hover:bg-red-900 transition">처음으로</button>
            </div>
          </div>
        )}

        {gameState === "win" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-indigo-950/80 backdrop-blur-md overflow-y-auto py-8">
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-4 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
              미션 성공!
            </h2>
            <p className="text-2xl text-white mb-8">기록: <span className="font-mono text-indigo-300 font-bold">{formattedTime}</span></p>
            
            <div className="bg-black/40 rounded-xl p-6 w-full max-w-sm mb-8 border border-white/10">
              <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center justify-center gap-2">
                🏆 Top 3 리더보드
              </h3>
              {isSubmitting ? (
                <div className="text-center text-slate-400 animate-pulse">결과를 저장하는 중...</div>
              ) : leaderboard.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {leaderboard.map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/5 px-4 py-2 rounded-lg">
                      <span className="font-semibold text-slate-200">{idx + 1}. {entry.name}</span>
                      <span className="font-mono text-indigo-300">{entry.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400">리더보드를 불러올 수 없습니다.</div>
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={onRestart} className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-400 transition shadow-lg shadow-indigo-500/30">다시 시작</button>
              <button onClick={onQuit} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition">처음으로</button>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full block"
          onTouchMove={handleTouchMove}
        />
      </div>

      <div className="mt-6 flex gap-4 w-full justify-center">
        {gameState !== "fail" && gameState !== "win" && gameState !== "countdown" && (
          <button 
            onClick={togglePause}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition flex-1 max-w-[200px]"
          >
            {gameState === "paused" ? "계속하기" : "일시정지"}
          </button>
        )}
        <button 
          onClick={onRestart}
          className="px-6 py-3 bg-indigo-900/50 hover:bg-indigo-900/70 text-indigo-100 rounded-xl font-medium transition flex-1 max-w-[200px] border border-indigo-500/30"
        >
          다시 시작
        </button>
        <button 
          onClick={onQuit}
          className="px-6 py-3 bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded-xl font-medium transition flex-1 max-w-[200px] border border-red-500/30"
        >
          게임 종료
        </button>
      </div>
    </div>
  );
}
