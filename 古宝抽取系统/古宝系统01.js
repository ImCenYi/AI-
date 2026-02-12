import React, { useState, useEffect } from 'react';
import { 
  X, Star, Sparkles, Coins, Zap, 
  ArrowUpCircle, ChevronRight, 
  Lock, Trophy, Flame, Boxes, Info
} from 'lucide-react';

// 基础古宝图鉴数据
const GU_BAO_LIBRARY = {
  '凡界古宝': [
    { id: 1, name: '青竹蜂云剑', rank: 'UR', icon: '🗡️', desc: '增加木系神通伤害', attr: '攻击' },
    { id: 2, name: '虚天鼎', rank: 'UR', icon: '🍯', desc: '提升法宝防御效能', attr: '防御' },
    { id: 3, name: '混元钵', rank: 'SSR', icon: '🥣', desc: '自动回复少量真元', attr: '气血' },
    { id: 4, name: '风雷翅', rank: 'SSR', icon: '🦋', desc: '提升身法与闪避', attr: '敏捷' },
    { id: 5, name: '五行环', rank: 'SR', icon: '⭕', desc: '五行属性全面加持', attr: '全属性' },
    { id: 6, name: '白鳞盾', rank: 'R', icon: '🛡️', desc: '抵御凡间法术伤害', attr: '减伤' },
  ],
  '灵界古宝': [
    { id: 101, name: '斩灵剑', rank: 'UR', icon: '⚔️', desc: '无视敌方护甲防御', attr: '穿透' },
    { id: 102, name: '万宝轮', rank: 'SSR', icon: '☸️', desc: '缩短法宝冷却时间', attr: '急速' },
  ],
};

const RANK_COLORS = {
  'UR': 'from-red-600 to-orange-500 shadow-red-500/50',
  'SSR': 'from-orange-500 to-yellow-400 shadow-orange-500/50',
  'SR': 'from-purple-600 to-pink-500 shadow-purple-500/50',
  'R': 'from-blue-500 to-cyan-400 shadow-blue-500/50',
};

const App = () => {
  const [activeTab, setActiveTab] = useState('凡界古宝');
  const [showResult, setShowResult] = useState(false);
  const [drawResults, setDrawResults] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pityCount, setPityCount] = useState(35);
  
  // 核心状态: shards (碎片), level (0为未激活), tier (重数)
  const [playerData, setPlayerData] = useState({});
  const [selectedId, setSelectedId] = useState(null); 

  // 抽奖逻辑：转化为碎片
  const handleDraw = (count) => {
    if (isDrawing) return;
    setIsDrawing(true);
    
    setTimeout(() => {
      const pool = GU_BAO_LIBRARY['凡界古宝'];
      const results = [];
      const newPlayerData = { ...playerData };

      for (let i = 0; i < count; i++) {
        const selected = pool[Math.floor(Math.random() * pool.length)];
        
        if (!newPlayerData[selected.id]) {
          newPlayerData[selected.id] = { shards: 1, level: 0, tier: 1 };
        } else {
          newPlayerData[selected.id].shards += 1;
        }

        results.push({ ...selected, isNew: newPlayerData[selected.id].level === 0 && newPlayerData[selected.id].shards === 1 });
      }
      
      setPlayerData(newPlayerData);
      setDrawResults(results);
      setShowResult(true);
      setIsDrawing(false);
      setPityCount(prev => (prev - count <= 0 ? 40 : prev - count));
    }, 600);
  };

  // 手动升级逻辑
  const handleUpgrade = (id) => {
    const data = playerData[id];
    if (!data || data.shards <= 0) return;

    setPlayerData(prev => {
      const current = { ...prev[id] };
      current.shards -= 1;
      current.level += 1;

      // 每10级进1重
      if (current.level > 10) {
        current.level = 1;
        current.tier += 1;
      }
      return { ...prev, [id]: current };
    });
  };

  const allItems = [...GU_BAO_LIBRARY['凡界古宝'], ...GU_BAO_LIBRARY['灵界古宝']];
  const selectedItem = selectedId ? allItems.find(i => i.id === selectedId) : null;
  const selectedStats = playerData[selectedId] || { shards: 0, level: 0, tier: 1 };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center p-4 font-sans select-none">
      <div className="relative w-full max-w-6xl aspect-[16/9] bg-[#0f172a] border-[1px] border-slate-700/50 rounded-2xl shadow-2xl flex overflow-hidden">
        
        {/* 1. 左侧侧边栏 */}
        <div className="w-20 bg-[#020617]/50 border-r border-slate-800 flex flex-col items-center py-6 gap-8">
          <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500">
            <Trophy size={24} />
          </div>
          <div className="flex-1 flex flex-col gap-4">
            {Object.keys(GU_BAO_LIBRARY).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="text-[10px] font-bold" style={{ writingMode: 'vertical-rl' }}>{tab.slice(0, 2)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. 中间图鉴列表 */}
        <div className="flex-1 bg-slate-900/20 p-8 overflow-y-auto custom-scrollbar">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500 uppercase">
                万 代 古 宝 库
              </h2>
              <p className="text-[10px] text-blue-500 font-mono mt-1 italic tracking-widest">COLLECTION OF ANCIENT POWER</p>
            </div>
          </div>

          {['UR', 'SSR', 'SR', 'R'].map(rank => {
            const items = (GU_BAO_LIBRARY[activeTab] || []).filter(i => i.rank === rank);
            if (items.length === 0) return null;
            
            return (
              <div key={rank} className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded bg-gradient-to-r ${RANK_COLORS[rank]} text-white`}>{rank}</span>
                  <div className="h-[1px] flex-1 bg-slate-800"></div>
                </div>
                
                <div className="grid grid-cols-4 gap-6">
                  {items.map(item => {
                    const stats = playerData[item.id] || { shards: 0, level: 0, tier: 1 };
                    const isUnlocked = stats.level > 0;
                    const canUpgrade = stats.shards > 0;

                    return (
                      <div 
                        key={item.id} 
                        onClick={() => setSelectedId(item.id)}
                        className={`relative group cursor-pointer transition-all ${selectedId === item.id ? 'scale-105' : ''}`}
                      >
                        <div className={`relative aspect-square rounded-2xl border-2 transition-all p-3 overflow-hidden ${
                          selectedId === item.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
                        } ${!isUnlocked ? 'grayscale opacity-40' : ''}`}>
                          
                          {/* 碎片的红点提示 */}
                          {canUpgrade && isUnlocked && (
                            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]"></div>
                          )}

                          {/* 级别显示 */}
                          {isUnlocked && (
                            <div className="absolute top-2 left-2 flex flex-col items-start z-10">
                              <span className="text-[8px] font-bold text-blue-400 leading-none">{stats.tier}重</span>
                              <span className="text-[10px] font-black text-white">{stats.level}阶</span>
                            </div>
                          )}

                          <div className="w-full h-full flex items-center justify-center text-4xl transform group-hover:rotate-12 transition-transform">
                            {item.icon}
                          </div>

                          {!isUnlocked && stats.shards > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                              <span className="text-[10px] font-bold text-orange-400">可激活 ({stats.shards})</span>
                            </div>
                          )}
                        </div>
                        <p className={`text-center mt-3 text-xs font-bold tracking-tighter ${selectedId === item.id ? 'text-blue-400' : 'text-slate-400'}`}>
                          {item.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. 右侧详情/抽奖面板切换 */}
        <div className="w-80 bg-[#020617] border-l border-slate-800 flex flex-col">
          {!selectedId ? (
            <div className="flex-1 flex flex-col">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex-1 rounded-2xl bg-gradient-to-b from-blue-900/20 to-transparent border border-blue-500/20 p-6 flex flex-col items-center justify-center text-center">
                  <div className="relative w-32 h-32 mb-6">
                    <div className="absolute inset-0 bg-blue-500/10 blur-3xl animate-pulse"></div>
                    <Flame size={128} className="text-blue-600 opacity-40" />
                    <Zap size={64} className="absolute inset-0 m-auto text-blue-400" />
                  </div>
                  <h3 className="text-xl font-black italic tracking-widest text-white mb-2 uppercase">天 命 寻 宝</h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed px-4 uppercase tracking-tighter">
                    通过消耗灵石，抽取各界遗失的古宝碎片，集齐碎片可感悟天地法则。
                  </p>
                  
                  <div className="mt-8 flex flex-col items-center gap-1">
                    <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-[10px] text-blue-400 font-bold">
                      UR保底进度: {pityCount}/40
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-2 gap-3 bg-slate-900/30">
                <button onClick={() => handleDraw(1)} className="py-4 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold hover:bg-slate-700 active:scale-95 transition-all uppercase">
                  探索一次
                </button>
                <button onClick={() => handleDraw(10)} className="py-4 rounded-xl bg-blue-600 border border-blue-400 text-xs font-bold hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-900/20 uppercase">
                  探索十次
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-4 flex justify-between items-center border-b border-slate-800">
                <button onClick={() => setSelectedId(null)} className="text-slate-500 hover:text-white">
                  <X size={20} />
                </button>
                <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Treasure Details</span>
                <Info size={16} className="text-slate-500" />
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex flex-col items-center mb-8">
                  <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${RANK_COLORS[selectedItem.rank]} p-0.5 shadow-2xl mb-6`}>
                    <div className="w-full h-full bg-[#0f172a] rounded-3xl flex items-center justify-center text-6xl">
                      {selectedItem.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-white mb-1">{selectedItem.name}</h3>
                  <div className="flex items-center gap-1">
                    {Array.from({length: Math.min(selectedStats.tier, 5)}).map((_, i) => (
                      <Star key={i} size={10} fill="#fbbf24" color="#fbbf24" />
                    ))}
                    {selectedStats.tier > 5 && <span className="text-[10px] text-yellow-500">+{selectedStats.tier - 5}</span>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <h4 className="text-[10px] font-black text-blue-500 uppercase mb-2 tracking-widest">属性加成</h4>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">{selectedItem.attr}</span>
                      <span className="text-blue-400 font-mono">+{((selectedStats.tier - 1) * 10 + selectedStats.level * 1).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <h4 className="text-[10px] font-black text-blue-500 uppercase mb-2 tracking-widest">古宝传记</h4>
                    <p className="text-xs text-slate-500 leading-relaxed italic">
                      {selectedItem.desc}。相传此物乃上古大能历经九九八十一难方才炼成。
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-900/30">
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] font-bold mb-1 px-1">
                    <span className="text-slate-500 uppercase tracking-widest">注入进度</span>
                    <span className="text-blue-400">{selectedStats.level}/10</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_8px_#3b82f6] transition-all duration-500"
                      style={{ width: `${(selectedStats.level / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <button 
                  onClick={() => handleUpgrade(selectedId)}
                  disabled={selectedStats.shards <= 0}
                  className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${
                    selectedStats.shards > 0 
                    ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20 active:scale-95' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-black uppercase tracking-widest">{selectedStats.level === 0 ? '激活古宝' : '注入灵气'}</span>
                    <span className="text-[9px] opacity-70 flex items-center gap-1 mt-0.5">
                      <Boxes size={8} /> 碎片消耗: 1 (拥有:{selectedStats.shards})
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 抽奖结果弹窗 */}
        {showResult && (
          <div className="absolute inset-0 z-50 bg-[#020617]/98 flex flex-col items-center justify-center animate-in fade-in duration-500">
            <h2 className="text-2xl font-black italic tracking-[0.8em] text-white/50 mb-16 uppercase">
              寻 得 碎 片
            </h2>

            <div className={`grid ${drawResults.length > 1 ? 'grid-cols-5' : 'grid-cols-1'} gap-10`}>
              {drawResults.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-col items-center animate-in zoom-in slide-in-from-bottom-8 duration-700"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${RANK_COLORS[item.rank]} p-[1px] relative shadow-2xl`}>
                    <div className="w-full h-full bg-[#0f172a] rounded-2xl flex items-center justify-center text-3xl">
                      {item.icon}
                      <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
                        x1
                      </div>
                    </div>
                  </div>
                  <p className="mt-6 text-xs font-bold text-slate-400">{item.name}</p>
                  {item.isNew && (
                    <span className="mt-1 px-2 py-0.5 bg-green-500/20 text-green-500 text-[8px] font-black rounded uppercase animate-pulse">
                      首次获得
                    </span>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setShowResult(false)} className="mt-20 text-[10px] font-bold text-slate-600 hover:text-white tracking-[0.5em] transition-all uppercase border-b border-transparent hover:border-white py-1">
              点击关闭宝库
            </button>
          </div>
        )}

        {/* 抽奖过场动画 */}
        {isDrawing && (
          <div className="absolute inset-0 z-[60] bg-[#020617] flex items-center justify-center">
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 border-[1px] border-blue-500/20 rounded-full animate-ping"></div>
              <div className="absolute inset-4 border-[1px] border-blue-500/40 rounded-full animate-ping [animation-delay:200ms]"></div>
              <div className="absolute inset-8 border-[1px] border-blue-500/60 rounded-full animate-ping [animation-delay:400ms]"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Zap className="text-blue-500 animate-bounce" size={48} />
                <span className="text-[10px] font-black text-blue-400 tracking-widest animate-pulse uppercase">正在推演天机</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;