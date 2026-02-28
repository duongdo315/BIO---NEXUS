import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Thermometer, 
  Heart, 
  Droplets, 
  FlaskConical, 
  Stethoscope,
  AlertTriangle,
  ChevronRight,
  Play,
  Info,
  Send,
  User,
  X,
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { generateMedicalResponse } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { translations, Language } from '../translations';
import { GoogleGenAI, Modality } from "@google/genai";

export default function ClinicalZone({ lang }: { lang: Language }) {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'chat' | 'labs' | 'feedback'>('chat');
  const [messages, setMessages] = useState<{ role: 'patient' | 'doctor', text: string }[]>([
    { role: 'patient', text: lang === 'vi' ? "Bác sĩ ơi, bụng tôi đau quá... lúc đầu đau quanh rốn nhưng giờ nó chuyển sang bên phải rồi." : "Doctor, my stomach hurts so much... it started around the belly button but now it's moved to the right side." }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isOrdering, setIsOrdering] = useState<string | null>(null);
  const [differential, setDifferential] = useState<string[]>(['Appendicitis', 'Gastroenteritis', 'UTI']);
  const [labResults, setLabResults] = useState<Record<string, string>>({});

  const [patientStatus, setPatientStatus] = useState({
    temp: 38.5,
    hr: 110,
    bp: '135/85',
    pain: 7
  });

  const [isSpeaking, setIsSpeaking] = useState(false);

  const playVoice = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say in a pained, weak voice: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audio.onended = () => setIsSpeaking(false);
        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  };

  const [labs, setLabs] = useState([
    { id: 'cbc', name: 'Complete Blood Count (CBC)', status: 'Pending', icon: FlaskConical },
    { id: 'us', name: 'Abdominal Ultrasound', status: 'Ordered', icon: Info },
    { id: 'ua', name: 'Urinalysis', status: 'Ready', icon: Droplets },
    { id: 'crp', name: 'C-Reactive Protein (CRP)', status: 'Ordered', icon: FlaskConical },
  ]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    const newMessages = [...messages, { role: 'doctor' as const, text: userMsg }];
    setMessages(newMessages);
    setInputValue('');
    setIsThinking(true);

    try {
      const prompt = `You are a patient named Mr. Nguyen. You have symptoms of acute appendicitis. 
      A medical student (the doctor) just said: "${userMsg}". 
      Respond as the patient, describing your pain and feelings. Keep it concise but realistic.
      Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'}.
      Also, provide an updated list of 3 possible differential diagnoses for the doctor in a separate section marked [DIFFERENTIAL].`;
      
      const response = await generateMedicalResponse(prompt, 'Med-Pro Mode');
      if (response) {
        const [patientText, diffText] = response.split('[DIFFERENTIAL]');
        setMessages([...newMessages, { role: 'patient', text: patientText.trim() }]);
        if (diffText) {
          setDifferential(diffText.trim().split('\n').map(d => d.replace(/^\d+\.\s*/, '').trim()));
        }
      }

      // Update differential diagnosis based on interaction
      if (newMessages.length % 3 === 0 && !response?.includes('[DIFFERENTIAL]')) {
        const diffPrompt = `Based on this clinical transcript, provide a list of the top 3 differential diagnoses. Return ONLY a comma-separated list.
        Transcript: ${newMessages.map(m => `${m.role}: ${m.text}`).join('\n')}`;
        const diffResponse = await generateMedicalResponse(diffPrompt, 'Med-Pro Mode');
        if (diffResponse) {
          setDifferential(diffResponse.split(',').map(s => s.trim()));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsThinking(false);
    }
  };

  const handleLabClick = async (labId: string, labName: string) => {
    if (labResults[labName]) return;
    
    setIsThinking(true);
    try {
      const prompt = `Generate a realistic lab result for a patient with acute appendicitis for the test: ${labName}. 
      Include values (like WBC count, CRP levels, or imaging findings) and a brief clinical interpretation. Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'}.`;
      const result = await generateMedicalResponse(prompt, 'Med-Pro Mode');
      setLabResults(prev => ({ ...prev, [labName]: result || (lang === 'vi' ? "Kết quả đang chờ." : "Result pending.") }));
      setLabs(prev => prev.map(l => l.id === labId ? { ...l, status: 'Ready' } : l));
    } catch (error) {
      console.error(error);
    } finally {
      setIsThinking(false);
    }
  };

  const generateFeedback = async () => {
    setIsThinking(true);
    setActiveTab('feedback');
    try {
      const transcript = messages.map(m => `${m.role}: ${m.text}`).join('\n');
      const prompt = `Analyze this clinical interaction between a medical student and a patient with suspected appendicitis. 
      Provide professional feedback on their diagnostic approach, communication, and pathophysiology reasoning.
      Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'}.
      Transcript:
      ${transcript}`;
      
      const result = await generateMedicalResponse(prompt, 'Med-Pro Mode');
      setFeedback(result || (lang === 'vi' ? "Không có phản hồi." : "No feedback available."));
    } catch (error) {
      setFeedback(lang === 'vi' ? "Lỗi khi tạo phản hồi lâm sàng." : "Error generating clinical feedback.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)]">
      {/* Patient Avatar & Vitals */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex-1 flex flex-col">
          <div className="relative aspect-[4/5] bg-slate-900">
            <img 
              src="https://picsum.photos/seed/patient/800/1000" 
              alt="AI Patient" 
              className="w-full h-full object-cover opacity-80"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-white font-bold text-lg">Patient #4402 - Mr. Nguyen</span>
              </div>
              <p className="text-slate-300 text-sm">Chief Complaint: Severe abdominal pain, nausea, and low-grade fever for 12 hours.</p>
            </div>
            <button 
              onClick={() => playVoice(messages[messages.length - 1].text)}
              disabled={isSpeaking}
              className={cn(
                "absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center text-white transition-all",
                isSpeaking ? "bg-teal-500 animate-pulse" : "bg-white/20 backdrop-blur-md hover:bg-white/30"
              )}
            >
              <Play fill="white" size={20} className={isSpeaking ? "animate-spin" : ""} />
            </button>
          </div>
          
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100">
              <div className="flex items-center gap-2 text-rose-600 mb-1">
                <Thermometer size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Temp</span>
              </div>
              <span className="text-xl font-bold text-rose-900">{patientStatus.temp}°C</span>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Heart size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Heart Rate</span>
              </div>
              <span className="text-xl font-bold text-blue-900">{patientStatus.hr} BPM</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <Droplets size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">BP</span>
              </div>
              <span className="text-xl font-bold text-emerald-900">{patientStatus.bp}</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <AlertTriangle size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Pain Scale</span>
              </div>
              <span className="text-xl font-bold text-amber-900">{patientStatus.pain}/10</span>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Differential Diagnosis</h4>
            <div className="flex flex-wrap gap-2">
              {differential.map((d, i) => (
                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Dashboard */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-100">
            {[
              { id: 'chat', label: t.anamnesis, icon: MessageSquare },
              { id: 'labs', label: t.labOrders, icon: FlaskConical },
              { id: 'feedback', label: t.clinicalFeedback, icon: Stethoscope },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => tab.id === 'feedback' ? generateFeedback() : setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 py-4 flex items-center justify-center gap-2 text-sm font-semibold transition-all",
                  activeTab === tab.id ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50/30" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'chat' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex gap-3", msg.role === 'doctor' && "justify-end")}>
                      {msg.role === 'patient' && <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center"><User size={16} className="text-slate-500" /></div>}
                      <div className={cn(
                        "p-4 rounded-2xl text-sm max-w-[80%]",
                        msg.role === 'patient' ? "bg-slate-100 rounded-tl-none text-slate-700" : "bg-teal-600 rounded-tr-none text-white shadow-md"
                      )}>
                        <div className="markdown-body">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      </div>
                      {msg.role === 'doctor' && <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold flex-shrink-0 text-xs">DOC</div>}
                    </div>
                  ))}
                  {isThinking && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 animate-pulse"></div>
                      <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'labs' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {labs.map((lab, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "p-4 border rounded-2xl transition-all group relative overflow-hidden",
                          lab.status === 'Ready' ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100 hover:border-blue-200"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <lab.icon size={20} className={cn(lab.status === 'Ready' ? "text-emerald-500" : "text-slate-400 group-hover:text-teal-500")} />
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                            lab.status === 'Ready' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                          )}>{lab.status}</span>
                        </div>
                        <h5 className="text-sm font-bold text-slate-800">{lab.name}</h5>
                        
                        <div className="mt-3">
                          {lab.status === 'Ready' ? (
                            <div className="p-3 bg-white rounded-xl border border-emerald-100 text-[10px] text-slate-600 max-h-32 overflow-y-auto markdown-body">
                              <ReactMarkdown>{labResults[lab.name]}</ReactMarkdown>
                            </div>
                          ) : isOrdering === lab.id ? (
                            <div className="flex items-center gap-2 text-xs text-teal-600 font-bold">
                              <div className="w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                              Processing...
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setIsOrdering(lab.id);
                                handleLabClick(lab.id, lab.name).finally(() => setIsOrdering(null));
                              }}
                              className="w-full py-2 bg-teal-600 text-white text-[10px] font-bold rounded-lg hover:bg-teal-700 transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                              <FlaskConical size={12} />
                              {t.orderTest}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {Object.keys(labResults).length > 0 && (
                    <div className="space-y-4 mt-8">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <FlaskConical size={16} className="text-teal-600" />
                        {t.labOrders}
                      </h4>
                      {Object.entries(labResults).map(([name, result], i) => (
                        <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                          <h5 className="text-xs font-bold text-teal-600 mb-2">{name}</h5>
                          <div className="text-xs text-slate-600 markdown-body">
                            <ReactMarkdown>{result}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'feedback' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {feedback ? (
                    <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm prose prose-teal max-w-none">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                          <Stethoscope size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 m-0">{t.clinicalFeedback}</h3>
                          <p className="text-xs text-slate-500 m-0">AI-Generated Assessment of your Interaction</p>
                        </div>
                      </div>
                      <div className="markdown-body text-sm text-slate-700">
                        <ReactMarkdown>{feedback}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <Stethoscope size={48} className="mb-4 opacity-20" />
                      <p>{lang === 'vi' ? "Hoàn thành hỏi bệnh để tạo phản hồi." : "Complete the anamnesis to generate feedback."}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t.askPatient} 
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
            <button 
              onClick={handleSendMessage}
              disabled={isThinking}
              className="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-lg shadow-teal-100"
            >
              <Send size={16} />
              {t.send}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
