import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Stethoscope, 
  UserCircle, 
  Search, 
  Bell, 
  Menu, 
  X,
  ChevronRight,
  Activity,
  BrainCircuit,
  Languages,
  User,
  Settings,
  LogOut,
  Camera
} from 'lucide-react';
import { cn } from './lib/utils';
import ScholarZone from './components/ScholarZone';
import ClinicalZone from './components/ClinicalZone';
import PatientZone from './components/PatientZone';
import { generateMedicalResponse } from './services/gemini';
import ReactMarkdown from 'react-markdown';
import { translations, Language } from './translations';

type AppMode = 'student' | 'medpro' | 'patient';

export default function App() {
  const [mode, setMode] = useState<AppMode>('student');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lang, setLang] = useState<Language>('en');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState({
    name: 'Jane Doe',
    role: 'Medical Student',
    email: 'jane.doe@bionexus.edu',
    avatar: 'JD'
  });

  const t = translations[lang];

  const modes = [
    { id: 'student', label: t.studentMode, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'medpro', label: t.medproMode, icon: Stethoscope, color: 'text-teal-600', bg: 'bg-teal-50' },
    { id: 'patient', label: t.patientMode, icon: UserCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResult(null);
    try {
      const result = await generateMedicalResponse(`Search the Bio-Nexus Knowledge Hub for: ${searchQuery}. Provide a concise, verified summary with key links to related concepts. Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'}.`, mode === 'student' ? 'Student Mode' : mode === 'medpro' ? 'Med-Pro Mode' : 'Patient Mode');
      setSearchResult(result || (lang === 'vi' ? "Không tìm thấy thông tin." : "No information found."));
    } catch (error) {
      setSearchResult(lang === 'vi' ? "Lỗi khi tìm kiếm Kho Tri Thức." : "Error searching the Knowledge Hub.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setUser({
      ...user,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
    });
    setIsProfileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-50 flex flex-col"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BrainCircuit className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">BioNexus</span>
            </motion.div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id as AppMode);
                setSearchResult(null);
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group",
                mode === m.id ? cn(m.bg, m.color, "font-semibold shadow-sm") : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <m.icon size={22} className={cn("shrink-0", mode === m.id ? m.color : "group-hover:text-slate-700")} />
              {isSidebarOpen && <span className="truncate">{m.label}</span>}
              {isSidebarOpen && mode === m.id && (
                <motion.div layoutId="active-indicator" className="ml-auto">
                  <ChevronRight size={16} />
                </motion.div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => setIsProfileOpen(true)}
            className={cn("w-full flex items-center gap-3 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left", !isSidebarOpen && "justify-center")}
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
              {user.avatar}
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate">{user.name}</span>
                <span className="text-xs text-slate-500 truncate">{user.role}</span>
              </div>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen flex flex-col",
        isSidebarOpen ? "ml-[280px]" : "ml-[80px]"
      )}>
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-8 flex-1">
            <form onSubmit={handleSearch} className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder} 
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </form>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-xs font-bold text-slate-600"
            >
              <Languages size={14} />
              {lang === 'en' ? 'EN' : 'VI'}
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Activity size={18} className="text-emerald-500" />
              <span>{t.systemOnline}</span>
            </div>
          </div>
        </header>

        {/* Zone Content */}
        <div className="p-8 flex-1">
          <AnimatePresence mode="wait">
            {searchResult ? (
              <motion.div
                key="search-result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto"
              >
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">{t.knowledgeHubResult}</h2>
                    <button 
                      onClick={() => setSearchResult(null)}
                      className="text-sm text-blue-600 font-semibold hover:underline"
                    >
                      {t.backToDashboard}
                    </button>
                  </div>
                  <div className="prose prose-slate max-w-none markdown-body">
                    <ReactMarkdown>{searchResult}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {mode === 'student' && <ScholarZone lang={lang} />}
                {mode === 'medpro' && <ClinicalZone lang={lang} />}
                {mode === 'patient' && <PatientZone lang={lang} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Modal */}
        <AnimatePresence>
          {isProfileOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsProfileOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                  <button 
                    onClick={() => setIsProfileOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="px-8 pb-8">
                  <div className="relative -mt-12 mb-6">
                    <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-lg">
                      <div className="w-full h-full rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold">
                        {user.avatar}
                      </div>
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-colors">
                      <Camera size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.name}</label>
                      <input 
                        name="name"
                        defaultValue={user.name}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.email}</label>
                      <input 
                        name="email"
                        defaultValue={user.email}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.role}</label>
                      <select 
                        name="role"
                        defaultValue={user.role}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                      >
                        <option value="Medical Student">{t.medicalStudent}</option>
                        <option value="Doctor">{t.doctor}</option>
                        <option value="Patient">{t.patient}</option>
                      </select>
                    </div>
                    <div className="pt-4 flex gap-3">
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                      >
                        {t.saveChanges}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsProfileOpen(false)}
                        className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        <LogOut size={20} />
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="p-6 text-center text-slate-400 text-xs border-t border-slate-100">
          <p>© 2026 BioNexus Ecosystem • "{t.tagline}"</p>
        </footer>
      </main>
    </div>
  );
}
