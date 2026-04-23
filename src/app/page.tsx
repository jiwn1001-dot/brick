"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import Game from "@/components/Game";

export default function Home() {
  const [screen, setScreen] = useState<"home" | "game">("home");
  const [userName, setUserName] = useState("");

  const startGame = () => {
    if (!userName.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    setScreen("game");
  };

  if (screen === "game") {
    return (
      <main className="w-full h-screen flex flex-col items-center justify-center p-4">
        <Game
          userName={userName}
          onQuit={() => setScreen("home")}
          onRestart={() => setScreen("home")}
        />
      </main>
    );
  }

  return (
    <main className="w-full h-screen flex flex-col items-center justify-center p-4">
      <Head>
        <title>INU 벽돌깨기</title>
        <meta name="description" content="INU 벽돌깨기 게임" />
      </Head>
      
      <div className="glass-panel p-8 rounded-3xl max-w-md w-full flex flex-col items-center animate-fade-in relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="z-10 flex flex-col items-center w-full">
          <h1 className="text-4xl font-extrabold mb-6 text-gradient tracking-tight drop-shadow-sm text-center">
            INU 벽돌깨기
          </h1>
          
          <div className="w-40 h-40 mb-6 rounded-full overflow-hidden border-4 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-105 transition-transform duration-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/Mascot.jpg" 
              alt="횃불이 마스코트" 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="w-full mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2 pl-1">사용자 이름</label>
            <input 
              type="text" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="premium-input w-full px-4 py-3 rounded-xl text-lg"
              onKeyDown={(e) => e.key === 'Enter' && startGame()}
            />
          </div>

          <button 
            onClick={startGame}
            className="premium-button w-full py-3 rounded-xl text-lg font-bold mb-8 tracking-wide"
          >
            게임 시작
          </button>

          <div className="text-sm text-slate-400 text-center glass-panel w-full py-3 rounded-xl">
            <p>제작자 정보</p>
            <p className="font-semibold text-slate-200 mt-1">법학부 202402689 최지완</p>
          </div>
        </div>
      </div>
    </main>
  );
}
