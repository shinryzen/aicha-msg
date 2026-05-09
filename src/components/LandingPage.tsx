import { motion } from 'motion/react';
import { MessageSquare, Users, Zap, Shield, Phone, Palette, ChevronRight, Share2, Heart, Globe, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="h-screen w-full bg-[#fff5f8] text-[#d63384] font-sans selection:bg-pink-100 overflow-x-hidden overflow-y-auto relative scroll-smooth">
      {/* Decorative decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-[#ffdae9] rounded-full blur-[120px] opacity-60" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, delay: 1 }}
          className="absolute bottom-[0%] right-[0%] w-[50%] h-[50%] bg-[#e0c3fc] rounded-full blur-[140px] opacity-40" 
        />
      </div>

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-xl border-b border-pink-100 px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#ff85a1] to-[#ffb7c5] rounded-xl flex items-center justify-center shadow-lg shadow-pink-200">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-white fill-white" />
            </div>
            <span className="font-black text-xl md:text-2xl tracking-tighter text-[#ff5d8f]">あいちゃ <span className="text-[#a18cd1] text-xs md:text-sm align-top">2.0</span></span>
          </div>
          <button 
            onClick={onStart}
            className="px-4 md:px-6 py-2 md:py-2.5 bg-[#ff85a1] text-white rounded-full text-xs md:text-sm font-black shadow-lg shadow-pink-200 hover:scale-105 transition-all active:scale-95"
          >
            あいちゃをはじめる！
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-40 pb-12 md:pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white text-[#ff85a1] rounded-full text-[10px] md:text-[11px] font-black mb-6 md:mb-8 border-2 border-pink-100 shadow-sm">
              <span className="animate-pulse">✨</span> aicha-msg.web.app <span>✨</span>
            </div>
            <h1 className="text-4xl md:text-8xl font-black tracking-tight text-[#ff5d8f] mb-6 md:mb-8 leading-[1.1] md:leading-[0.9]">
              つながる、<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff85a1] to-[#a18cd1]">わくわくする場所。</span>
            </h1>

            {/* Profile Circles */}
            <div className="flex justify-center gap-6 md:gap-10 mb-10 md:mb-16">
              {[
                { name: 'あいた', color: 'bg-gradient-to-br from-[#ff85a1] to-[#ffb7c5]', src: '/aita.png' },
                { name: 'あいみ', color: 'bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb]', src: '/aimi.png', shift: true },
                { name: 'ちゃっちゃ', color: 'bg-gradient-to-br from-[#fad0c4] to-[#ffd1ff]', src: '/chaccha.png' }
              ].map((char, i) => (
                <div key={i} className={cn("flex flex-col items-center gap-3", char.shift && "-translate-y-4 md:-translate-y-6")}>
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={cn("w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-xl overflow-hidden flex items-center justify-center group cursor-pointer relative bg-white")}
                  >
                     <img 
                       src={char.src} 
                       alt={char.name} 
                       className="w-full h-full object-cover"
                       onError={(e) => {
                         // Fallback to bottts if local file not found yet
                         (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${char.name}&backgroundColor=Transparent`;
                       }}
                     />
                     <div className="absolute inset-0 bg-gradient-to-b from-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                  <span className="text-[10px] md:text-sm font-black bg-white rounded-full px-4 py-1 shadow-sm text-[#ff5d8f] border border-pink-50">{char.name}</span>
                </div>
              ))}
            </div>

            <p className="text-lg md:text-2xl text-[#d63384]/80 max-w-3xl mx-auto mb-10 md:mb-16 font-bold leading-relaxed px-6">
              あいちゃ2.0へようこそ！🌸<br />
              スクチャ！が始まりました！画面共有を楽しもう🌸<br />
              あいちゃ動作検証中です。不具合はぼってがまでお伝えください。
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center px-4">
              <button 
                onClick={onStart}
                className="w-full sm:w-auto px-8 py-4 md:px-14 md:py-6 bg-gradient-to-r from-[#ff85a1] to-[#ffb7c5] text-white rounded-full font-black text-lg md:text-2xl shadow-xl shadow-pink-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 border-b-[6px] md:border-b-8 border-[#e06684] mt-2 group whitespace-nowrap"
              >
                あいちゃをはじめる！
                <ChevronRight className="w-5 h-5 md:w-7 md:h-7 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Screenshot Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 md:mt-24 relative mx-auto max-w-5xl px-4"
          >
            <div className="relative p-1 md:p-2 bg-pink-100/30 rounded-3xl md:rounded-[2.5rem] border-2 border-pink-100/50">
              <div className="bg-white rounded-[1.2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[250px] md:aspect-[16/10] border border-pink-100 flex flex-col">
                  <div className="bg-[#fff5f8] p-2 md:p-4 border-b border-pink-50 flex items-center gap-1 md:gap-4 shrink-0">
                    <div className="flex gap-1 md:gap-1.5">
                      <div className="w-2.5 md:w-3.5 h-2.5 md:h-3.5 rounded-full bg-pink-200" />
                      <div className="w-2.5 md:w-3.5 h-2.5 md:h-3.5 rounded-full bg-pink-200" />
                      <div className="w-2.5 md:w-3.5 h-2.5 md:h-3.5 rounded-full bg-pink-200" />
                    </div>
                    <div className="flex-1 h-6 md:h-8 bg-white rounded-lg border border-pink-50 text-[10px] md:text-xs flex items-center px-3 md:px-4 text-pink-300 font-bold">
                        https://aicha-msg.web.app/lobby
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center bg-gradient-to-b from-white to-[#fff5f8]">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-pink-50 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center mb-4 md:mb-8 shadow-inner">
                        <Heart className="w-8 h-8 md:w-12 md:h-12 text-[#ff85a1]" />
                    </div>
                    <h3 className="text-xl md:text-3xl font-black text-[#ff5d8f] tracking-tight">みんなとつながる新しい交流の世界へ！</h3>
                    <p className="text-xs md:text-base font-bold text-[#d63384]/60 mt-3 md:mt-4 max-w-xs md:max-w-md">ボイスチャットとメッセンジャーで、もっと楽しく、もっと身近に。</p>
                  </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-20 md:py-32 px-6 relative bg-white/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-2xl md:text-4xl font-black text-[#ff5d8f] mb-4">あいちゃのヒミツ ✨</h2>
            <p className="text-sm md:text-lg font-bold text-[#d63384]/60">かわいくて、とってもべんり！</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
             {[
               { emoji: '🎤', title: 'クリアVOICE', desc: '独自のエンジンで、まるで隣にいるような透き通る声をお届け。', color: 'blue' as const },
               { emoji: '✨', title: 'すくちゃ', desc: '画面を共有しながら、みんなでわいわいチャットを楽しめるよ！', color: 'purple' as const },
               { emoji: '💌', title: 'メッセンジャー', desc: '一瞬で届くメッセージとスタンプで、会話がもっともっと弾むよ。', color: 'pink' as const }
             ].map((feature, i) => (
               <motion.div 
                 key={i}
                 whileHover={{ y: -10 }}
                 className={cn(
                   "p-8 md:p-10 rounded-3xl bg-white shadow-xl shadow-pink-50 border-2 transition-all group relative flex flex-col items-center text-center", 
                   feature.color === 'blue' ? "border-blue-100 hover:border-blue-300" : (feature.color === 'purple' ? "border-purple-100 hover:border-purple-300" : "border-pink-100 hover:border-pink-300")
                 )}
               >
                  <div className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl mb-6 shadow-inner shrink-0",
                    feature.color === 'blue' ? "bg-blue-50" : (feature.color === 'purple' ? "bg-purple-50" : "bg-pink-50")
                  )}>
                    {feature.emoji}
                  </div>
                  <h4 className={cn(
                    "text-xl md:text-2xl font-black mb-3",
                    feature.color === 'blue' ? "text-blue-500" : (feature.color === 'purple' ? "text-purple-500" : "text-[#ff85a1]")
                  )}>
                    {feature.title}
                  </h4>
                  <p className="text-xs md:text-sm font-bold text-slate-500 leading-relaxed">
                    {feature.desc}
                  </p>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Platform Info */}
      <section className="py-20 md:py-32 px-6 bg-gradient-to-br from-[#ff85a1] to-[#a18cd1] text-white overflow-hidden relative rounded-[2.5rem] md:rounded-[4rem] mx-4 md:mx-12 mb-16 shadow-2xl shadow-pink-200">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none flex items-center justify-center">
           <Globe className="w-64 h-64 md:w-[400px] md:h-[400px] rotate-12" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
          <h2 className="text-3xl md:text-6xl font-black mb-8 tracking-tight">マルチデバイス対応。</h2>
          <p className="text-sm md:text-xl text-white/90 mb-12 font-black leading-relaxed uppercase tracking-[0.3em]">
            Web / iOS / Android / Desktop
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
             <div className="px-6 md:px-10 py-3 md:py-5 bg-white/20 rounded-2xl border border-white/30 backdrop-blur-md text-xs md:text-lg font-black shadow-lg">アプリインストール不要</div>
             <div className="px-6 md:px-10 py-3 md:py-5 bg-white/20 rounded-2xl border border-white/30 backdrop-blur-md text-xs md:text-lg font-black shadow-lg">全機能完全無料</div>
             <div className="px-6 md:px-10 py-3 md:py-5 bg-white/20 rounded-2xl border border-white/30 backdrop-blur-md text-xs md:text-lg font-black shadow-lg">30秒でチャット開始</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 md:py-32 px-6 border-t border-pink-100 text-center bg-white/30">
        <div className="flex items-center justify-center gap-3 mb-8">
           <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-100 rounded-xl flex items-center justify-center shadow-inner">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-[#ff85a1] fill-[#ff85a1]" />
           </div>
           <span className="font-black text-2xl md:text-3xl tracking-tighter text-pink-300">あいちゃ</span>
        </div>
        <p className="text-pink-300 text-xs md:text-sm font-black uppercase tracking-[0.2em]">&copy; 2026 あいちゃ プロジェクト. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureBubble({ emoji, title, desc, color }: { emoji: string, title: string, desc: string, color: 'blue' | 'purple' | 'pink' }) {
  const colors = {
    blue: "bg-blue-50 text-blue-500 border-blue-100",
    purple: "bg-purple-50 text-purple-500 border-purple-100",
    pink: "bg-pink-50 text-pink-500 border-pink-100"
  };

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className={cn("p-10 rounded-2xl bg-white shadow-xl shadow-pink-50 border-2", colors[color])}
    >
      <div className={cn("w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-4xl mb-6 shadow-inner", colors[color].split(' ')[0])}>
        {emoji}
      </div>
      <h3 className="text-2xl font-black text-slate-800 mb-4">{title}</h3>
      <p className="text-slate-500 font-bold leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function Mic(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
