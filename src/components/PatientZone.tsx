import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  MessageSquare, 
  Plus, 
  Search, 
  ChevronRight, 
  X,
  Share2,
  ThumbsUp,
  Clock,
  Send,
  User,
  ShieldCheck,
  Zap,
  MessageCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { generateMedicalResponse } from '../services/gemini';
import MarkdownRenderer from './MarkdownRenderer';
import { translations, Language } from '../translations';
import { generateMockThreads, Thread } from '../data/mockThreads';

export default function PatientZone({ lang }: { lang: Language }) {
  const t = translations[lang];
  const [activeView, setActiveView] = useState<'twin' | 'community'>('twin');
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const [organInsight, setOrganInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  
  const [showAlert, setShowAlert] = useState(false);
  const [alertContent, setAlertContent] = useState({ title: '', message: '', advice: '' });

  const [threads, setThreads] = useState<Thread[]>(generateMockThreads(lang));

  const [searchQuery, setSearchQuery] = useState('');
  const [likedThreads, setLikedThreads] = useState<Set<number>>(new Set());
  const [bookmarkedThreads, setBookmarkedThreads] = useState<Set<number>>(new Set());
  const [threadFilter, setThreadFilter] = useState<'all' | 'verified' | 'my' | 'bookmarked' | 'liked'>('all');
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isNewThreadModalOpen, setIsNewThreadModalOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [replyInput, setReplyInput] = useState('');

  const handleOrganClick = async (organ: string) => {
    setSelectedOrgan(organ);
    setIsLoadingInsight(true);
    try {
      const prompt = `Provide a personalized health insight for the ${organ} based on a Bio-Digital Twin profile. 
      The user is a 35-year-old with moderate activity levels. 
      Include:
      1. Current status (simulated).
      2. 2 recommendations for optimization.
      3. A related medical concept to study.
      Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'}.`;
      const response = await generateMedicalResponse(prompt, 'Patient Mode');
      setOrganInsight(response || (lang === 'vi' ? "Không có dữ liệu." : "No data available."));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const triggerAlert = () => {
    setAlertContent({
      title: lang === 'vi' ? 'Phát hiện rối loạn nhịp tim' : 'Arrhythmia Detected',
      message: lang === 'vi' ? 'Bản sao số của bạn phát hiện nhịp tim bất thường (AFib) trong 10 phút qua.' : 'Your Bio-Digital Twin detected an irregular heart rhythm (AFib) over the last 10 minutes.',
      advice: lang === 'vi' ? 'Hãy ngồi xuống, hít thở sâu và liên hệ với bác sĩ của bạn ngay lập tức. Tránh các hoạt động mạnh.' : 'Please sit down, take deep breaths, and contact your physician immediately. Avoid strenuous activity.'
    });
    setShowAlert(true);
    setSelectedOrgan('Heart');
  };

  const handlePostThread = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newThread: Thread = {
      id: Date.now(),
      author: 'You',
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()),
      likes: 0,
      replies: [],
      time: 'Just now',
      verified: false
    };
    setThreads([newThread, ...threads]);
    setIsNewThreadModalOpen(false);
  };

  const handleShareWithDoctor = () => {
    setIsSharing(true);
    setTimeout(() => {
      setIsSharing(false);
      setShowShareModal(true);
    }, 1500);
  };

  const toggleLike = (id: number) => {
    setLikedThreads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBookmark = (id: number) => {
    setBookmarkedThreads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markAsSolution = (threadId: number, replyIndex: number) => {
    setThreads(prev => prev.map(t => 
      t.id === threadId 
        ? { ...t, replies: t.replies.map((r, i) => ({ ...r, isSolution: i === replyIndex })) }
        : t
    ));
  };

  const handleReply = () => {
    if (!replyInput.trim() || !selectedThread) return;
    const updatedThreads = threads.map(t => 
      t.id === selectedThread.id 
        ? { ...t, replies: [...t.replies, { author: 'You', text: replyInput }] } 
        : t
    );
    setThreads(updatedThreads);
    setSelectedThread(updatedThreads.find(t => t.id === selectedThread.id) || null);
    setReplyInput('');
  };

  const filteredThreads = threads.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* View Toggle */}
      <div className="flex flex-col items-center gap-4">
        <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex">
          <button 
            onClick={() => setActiveView('twin')}
            className={cn(
              "px-8 py-2 rounded-xl text-sm font-bold transition-all",
              activeView === 'twin' ? "bg-teal-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {t.digitalTwin}
          </button>
          <button 
            onClick={() => setActiveView('community')}
            className={cn(
              "px-8 py-2 rounded-xl text-sm font-bold transition-all",
              activeView === 'community' ? "bg-teal-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {t.threads}
          </button>
        </div>
        
        {activeView === 'twin' && (
          <button 
            onClick={triggerAlert}
            className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1"
          >
            <Zap size={10} />
            {lang === 'vi' ? 'Mô phỏng cảnh báo' : 'Simulate Wearable Alert'}
          </button>
        )}
      </div>

      {activeView === 'twin' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Bio-Digital Twin Model */}
          <div className="lg:col-span-7 bg-white rounded-[3rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden min-h-[600px] flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#f0fdfa_0%,#ffffff_100%)]"></div>
            
            <svg viewBox="0 0 200 400" className="w-full h-[500px] relative z-10 drop-shadow-2xl">
              {/* Body Outline with Glow */}
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <motion.path
                d="M100,15 C112,15 120,25 120,38 C120,48 114,58 108,63 C122,66 138,72 148,85 C155,95 162,120 165,145 C166,155 156,158 152,148 C145,130 140,105 132,90 L132,180 C135,220 142,280 145,330 C146,345 130,348 125,335 C118,300 112,240 108,210 C104,240 98,300 91,335 C86,348 70,345 71,330 C74,280 81,220 84,180 L84,90 C76,105 71,130 64,148 C60,158 50,155 51,145 C54,120 61,95 68,85 C78,72 94,66 108,63 C102,58 96,48 96,38 C96,25 104,15 100,15 Z"
                fill="none"
                stroke="#0D9488"
                strokeWidth="6"
                strokeLinecap="round"
                filter="url(#glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.15 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />

              <motion.path
                d="M100,15 C112,15 120,25 120,38 C120,48 114,58 108,63 C122,66 138,72 148,85 C155,95 162,120 165,145 C166,155 156,158 152,148 C145,130 140,105 132,90 L132,180 C135,220 142,280 145,330 C146,345 130,348 125,335 C118,300 112,240 108,210 C104,240 98,300 91,335 C86,348 70,345 71,330 C74,280 81,220 84,180 L84,90 C76,105 71,130 64,148 C60,158 50,155 51,145 C54,120 61,95 68,85 C78,72 94,66 108,63 C102,58 96,48 96,38 C96,25 104,15 100,15 Z"
                fill="none"
                stroke="#0D9488"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.5, ease: "easeInOut" }}
              />

              {/* Brain */}
              <motion.g className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleOrganClick('Brain')}>
                <path d="M100,22 C112,22 116,30 114,40 C112,48 104,50 100,48 C96,50 88,48 86,40 C84,30 88,22 100,22 Z" fill={selectedOrgan === 'Brain' ? '#8B5CF6' : '#E2E8F0'} stroke="#8B5CF6" strokeWidth="2" />
              </motion.g>

              {/* Lungs */}
              <motion.g className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleOrganClick('Lungs')}>
                <path d="M86,75 C94,75 96,90 94,105 C92,115 84,118 78,112 C74,100 78,80 86,75 Z" fill={selectedOrgan === 'Lungs' ? '#10B981' : '#E2E8F0'} stroke="#10B981" strokeWidth="2" />
                <path d="M114,75 C106,75 104,90 106,105 C108,115 116,118 122,112 C126,100 122,80 114,75 Z" fill={selectedOrgan === 'Lungs' ? '#10B981' : '#E2E8F0'} stroke="#10B981" strokeWidth="2" />
              </motion.g>

              {/* Heart */}
              <motion.g className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleOrganClick('Heart')}>
                <motion.path 
                  d="M102,92 C108,88 114,94 110,102 C106,110 98,112 96,106 C92,98 96,92 102,92 Z" 
                  fill={selectedOrgan === 'Heart' ? '#EF4444' : '#E2E8F0'} 
                  stroke="#EF4444" 
                  strokeWidth="2" 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  style={{ transformOrigin: '102px 100px' }}
                />
              </motion.g>

              {/* Liver */}
              <motion.g className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleOrganClick('Liver')}>
                <path d="M76,110 C90,106 106,112 110,120 C112,126 100,130 90,128 C80,126 74,120 76,110 Z" fill={selectedOrgan === 'Liver' ? '#F59E0B' : '#E2E8F0'} stroke="#F59E0B" strokeWidth="2" />
              </motion.g>

              {/* Stomach */}
              <motion.g className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleOrganClick('Stomach')}>
                <path d="M112,114 C122,112 126,122 120,130 C114,136 104,132 104,124 C104,118 108,116 112,114 Z" fill={selectedOrgan === 'Stomach' ? '#3B82F6' : '#E2E8F0'} stroke="#3B82F6" strokeWidth="2" />
              </motion.g>

              {/* Kidneys */}
              <motion.g className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleOrganClick('Kidneys')}>
                <path d="M84,130 C88,128 92,134 90,140 C88,146 82,144 80,138 C78,132 80,130 84,130 Z" fill={selectedOrgan === 'Kidneys' ? '#8B5CF6' : '#E2E8F0'} stroke="#8B5CF6" strokeWidth="2" />
                <path d="M116,130 C112,128 108,134 110,140 C112,146 118,144 120,138 C122,132 120,130 116,130 Z" fill={selectedOrgan === 'Kidneys' ? '#8B5CF6' : '#E2E8F0'} stroke="#8B5CF6" strokeWidth="2" />
              </motion.g>

              {/* Intestines */}
              <motion.g className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleOrganClick('Intestines')}>
                <path d="M82,142 C92,138 108,138 118,142 C124,150 120,166 110,170 C100,174 90,170 80,166 C76,158 76,148 82,142 Z" fill={selectedOrgan === 'Intestines' ? '#EC4899' : '#E2E8F0'} stroke="#EC4899" strokeWidth="2" />
              </motion.g>
            </svg>

            <div className="absolute top-8 left-8 space-y-4">
              <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-rose-600 mb-1">
                  <Heart size={16} />
                  <span className="text-[10px] font-bold uppercase">{t.heartRate}</span>
                </div>
                <div className="text-2xl font-bold">72 <span className="text-xs text-slate-400">BPM</span></div>
              </div>
              <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-teal-600 mb-1">
                  <Activity size={16} />
                  <span className="text-[10px] font-bold uppercase">{t.bloodOxygen}</span>
                </div>
                <div className="text-2xl font-bold">98 <span className="text-xs text-slate-400">%</span></div>
              </div>
            </div>

            <div className="absolute bottom-8 right-8 flex flex-col gap-3 items-end">
              <button 
                onClick={triggerAlert}
                className="bg-rose-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-rose-700 transition-all text-xs"
              >
                <AlertTriangle size={16} />
                {lang === 'vi' ? 'Mô phỏng cảnh báo' : 'Simulate Alert'}
              </button>
              <div className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center gap-2">
                <ShieldCheck size={20} />
                {t.healthScore}: 92/100
              </div>
            </div>
          </div>

          {/* Insights Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Zap size={18} className="text-amber-500" />
                  {t.insights}
                </h3>
                <button 
                  onClick={handleShareWithDoctor}
                  disabled={isSharing}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold hover:bg-blue-100 transition-all disabled:opacity-50"
                >
                  {isSharing ? <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <Share2 size={12} />}
                  {lang === 'vi' ? 'Chia sẻ' : 'Share'}
                </button>
              </div>
              
              {isLoadingInsight ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t.analyzingTwin}</p>
                </div>
              ) : organInsight ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">{selectedOrgan} Insight</span>
                    <button onClick={() => setOrganInsight(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                  </div>
                  <div className="text-sm text-slate-700 markdown-body">
                    <MarkdownRenderer content={organInsight} />
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
                    <p className="text-sm text-teal-800 font-medium">{lang === 'vi' ? 'Nhấp vào một cơ quan để xem phân tích AI.' : 'Click on an organ to see AI analysis.'}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">{lang === 'vi' ? 'Lịch sử chỉ số' : 'Daily Vitals History'}</h3>
              <div className="space-y-3">
                {[
                  { label: 'Deep Sleep', value: '2h 15m', trend: '+10%', color: 'bg-indigo-500' },
                  { label: 'Steps', value: '8,432', trend: '-5%', color: 'bg-teal-500' },
                  { label: 'Calories', value: '1,850', trend: 'Stable', color: 'bg-rose-500' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", stat.color)}></div>
                      <span className="text-sm text-slate-600">{stat.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold">{stat.value}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        stat.trend.startsWith('+') ? "bg-emerald-100 text-emerald-600" : 
                        stat.trend === 'Stable' ? "bg-slate-100 text-slate-500" : "bg-rose-100 text-rose-600"
                      )}>{stat.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleShareWithDoctor}
              disabled={isSharing}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSharing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Share2 size={18} />}
              {lang === 'vi' ? 'Chia sẻ với bác sĩ' : 'Share Digital Twin with Doctor'}
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Community Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <h2 className="text-3xl font-bold text-slate-800">BIO-Threads</h2>
              <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl gap-1">
                {[
                  { id: 'all', label: t.filterAll },
                  { id: 'verified', label: t.filterVerified },
                  { id: 'my', label: t.filterMy },
                  { id: 'bookmarked', label: t.filterBookmarked },
                  { id: 'liked', label: t.filterMostLiked },
                ].map(filter => (
                  <button 
                    key={filter.id}
                    onClick={() => setThreadFilter(filter.id as any)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all", 
                      threadFilter === filter.id ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchThreads} 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <button 
                onClick={() => setIsNewThreadModalOpen(true)}
                className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center gap-2 hover:bg-teal-700 transition-all shrink-0"
              >
                <Plus size={20} />
                {t.newThread}
              </button>
            </div>
          </div>

          {/* Thread List */}
          <div className="space-y-4">
            {threads
              .filter(t => {
                if (threadFilter === 'verified') return t.verified;
                if (threadFilter === 'my') return t.author === 'You';
                if (threadFilter === 'bookmarked') return bookmarkedThreads.has(t.id);
                if (threadFilter === 'liked') return likedThreads.has(t.id);
                return true;
              })
              .filter(t => 
                t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .sort((a, b) => threadFilter === 'liked' ? b.likes - a.likes : 0)
              .map((thread) => (
              <motion.div 
                key={thread.id}
                layoutId={`thread-${thread.id}`}
                onClick={() => setSelectedThread(thread)}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-teal-300 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex flex-wrap gap-2">
                    {thread.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md uppercase tracking-wider">
                        #{tag}
                      </span>
                    ))}
                    {thread.verified && (
                      <span className="text-[10px] font-bold px-2 py-1 bg-teal-100 text-teal-600 rounded-md uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck size={10} />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleLike(thread.id); }}
                      className={cn("flex items-center gap-1 text-xs font-bold transition-colors", likedThreads.has(thread.id) ? "text-rose-600" : "hover:text-rose-600")}
                    >
                      <Heart size={14} fill={likedThreads.has(thread.id) ? "currentColor" : "none"} /> {thread.likes + (likedThreads.has(thread.id) ? 1 : 0)}
                    </button>
                    <div className="flex items-center gap-1 text-xs font-bold">
                      <MessageCircle size={14} /> {thread.replies.length}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(thread.id); }}
                      className={cn("flex items-center gap-1 text-xs font-bold transition-colors", bookmarkedThreads.has(thread.id) ? "text-amber-600" : "hover:text-amber-600")}
                    >
                      <TrendingUp size={14} className={bookmarkedThreads.has(thread.id) ? "text-amber-600" : ""} />
                    </button>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-slate-800 group-hover:text-teal-600 transition-colors mb-2">{thread.title}</h4>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold">{thread.author[0]}</div>
                  <span className="text-xs text-slate-500">Posted by <span className="font-semibold text-slate-700">{thread.author}</span> • {thread.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AnimatePresence>
        {showAlert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAlert(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-rose-600 p-8 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">{alertContent.title}</h3>
                <p className="text-rose-100 text-sm">{alertContent.message}</p>
              </div>
              <div className="p-8">
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl mb-6">
                  <h4 className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-2">Actionable Advice</h4>
                  <p className="text-sm text-rose-800 leading-relaxed">{alertContent.advice}</p>
                </div>
                <button 
                  onClick={() => setShowAlert(false)}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors"
                >
                  Acknowledge Alert
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Thread Detail Modal */}
      <AnimatePresence>
        {selectedThread && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedThread(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-bold">
                    {selectedThread.author[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{selectedThread.title}</h3>
                    <p className="text-xs text-slate-500">by {selectedThread.author} • {selectedThread.time}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedThread(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="text-slate-700 leading-relaxed markdown-body">
                  <MarkdownRenderer content={selectedThread.content} />
                </div>
                
                <div className="flex gap-2">
                  {selectedThread.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-teal-50 text-teal-600 text-xs font-bold rounded-full">#{tag}</span>
                  ))}
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <MessageSquare size={18} className="text-teal-600" />
                    {t.reply} ({selectedThread.replies.length})
                  </h4>
                  <div className="space-y-4">
                    {selectedThread.replies.map((reply, i) => (
                      <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                          {reply.author[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold text-slate-800">{reply.author}</p>
                            {/* @ts-ignore */}
                            {reply.isSolution && <span className="px-2 py-0.5 bg-emerald-600 text-white text-[8px] font-bold rounded-full uppercase">Solution</span>}
                          </div>
                          <p className="text-sm text-slate-600">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <input 
                  type="text" 
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                  placeholder={t.reply + "..."} 
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <button 
                  onClick={handleReply}
                  className="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-teal-700 transition-colors flex items-center gap-2"
                >
                  <Send size={16} />
                  {t.send}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Thread Modal */}
      <AnimatePresence>
        {isNewThreadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewThreadModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">{t.newThread}</h3>
                <button onClick={() => setIsNewThreadModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>
              <form onSubmit={handlePostThread} className="p-8 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Title</label>
                  <input 
                    name="title"
                    placeholder="What's on your mind?"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Content</label>
                  <textarea 
                    name="content"
                    rows={4}
                    placeholder="Share your thoughts or questions..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tags (comma separated)</label>
                  <input 
                    name="tags"
                    placeholder="e.g. Heart, Nutrition, Wearables"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-100 mt-4"
                >
                  {t.post}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{lang === 'vi' ? 'Báo Cáo Đã Được Gửi' : 'Report Shared Successfully'}</h3>
                  <p className="text-sm text-slate-500">{t.shareSuccess}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4 mb-8">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Recipient</span>
                  <span className="text-sm font-bold text-slate-700">Dr. Liam O'Connor (Primary Care)</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Data Included</span>
                  <span className="text-sm font-bold text-slate-700">Full Twin Profile, Vitals, Genetic Risk</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Access Level</span>
                  <span className="text-sm font-bold text-emerald-600">Full Clinical Access</span>
                </div>
              </div>

              <button 
                onClick={() => setShowShareModal(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
