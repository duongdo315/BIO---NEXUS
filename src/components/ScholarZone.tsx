import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Image as ImageIcon,
  X,
  Dna,
  BookOpen,
  Sparkles,
  MessageSquareText,
  Send,
  BrainCircuit,
  Trophy,
  Timer,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Settings,
  Medal,
  Info,
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import { generateMedicalResponse, solveExamQuestion } from '../services/gemini';
import MarkdownRenderer from './MarkdownRenderer';
import KnowledgeGraph from './KnowledgeGraph';
import { translations, Language } from '../translations';

interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
}

const initialNodes: GraphNode[] = [
  { id: '1', x: 150, y: 200, label: 'Gene', color: 'bg-blue-500' },
  { id: '2', x: 300, y: 100, label: 'mRNA', color: 'bg-blue-400' },
  { id: '3', x: 300, y: 300, label: 'Epigenetics', color: 'bg-indigo-400' },
  { id: '4', x: 500, y: 100, label: 'Protein', color: 'bg-teal-500' },
  { id: '5', x: 500, y: 300, label: 'Enzyme', color: 'bg-teal-400' },
  { id: '6', x: 700, y: 200, label: 'Metabolism', color: 'bg-emerald-500' },
  { id: '7', x: 400, y: 200, label: 'Ribosome', color: 'bg-purple-500' },
  { id: '8', x: 600, y: 200, label: 'ATP', color: 'bg-amber-500' },
];

const initialRadarData = [
  { subject: 'Genetics', A: 120, fullMark: 150 },
  { subject: 'Physiology', A: 98, fullMark: 150 },
  { subject: 'Cell Bio', A: 86, fullMark: 150 },
  { subject: 'Ecology', A: 99, fullMark: 150 },
  { subject: 'Evolution', A: 85, fullMark: 150 },
  { subject: 'Biochem', A: 65, fullMark: 150 },
];

export default function ScholarZone({ lang }: { lang: Language }) {
  const t = translations[lang];
  const [isSolving, setIsSolving] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string | null>(null);
  const [learningPath, setLearningPath] = useState<string | null>(null);
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const [radarData, setRadarData] = useState(initialRadarData);
  const [activeSubTab, setActiveSubTab] = useState<'solver' | 'practice' | 'mentor' | 'simulation' | 'olympiad'>('solver');
  
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [resourceContent, setResourceContent] = useState<string | null>(null);
  const [isLoadingResource, setIsLoadingResource] = useState(false);

  const [quiz, setQuiz] = useState<string | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  
  const [mentorMessages, setMentorMessages] = useState<{ role: 'user' | 'mentor', text: string }[]>([]);
  const [mentorInput, setMentorInput] = useState('');
  const [isMentorThinking, setIsMentorThinking] = useState(false);

  // Exam Simulation State
  const [examState, setExamState] = useState<{
    isActive: boolean;
    questions: { question: string, options?: string[], correctAnswer?: number | string, explanation: string, type: 'mcq' | 'essay' }[];
    userAnswers: (number | string)[];
    currentQuestionIndex: number;
    timeLeft: number;
    isFinished: boolean;
    config: {
      numQuestions: number;
      duration: number;
      type: 'mcq' | 'essay';
      level: 'olympic' | 'hsgqg';
    };
  }>({
    isActive: false,
    questions: [],
    userAnswers: [],
    currentQuestionIndex: 0,
    timeLeft: 3600,
    isFinished: false,
    config: {
      numQuestions: 5,
      duration: 60,
      type: 'mcq',
      level: 'olympic'
    }
  });
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [essayFeedback, setEssayFeedback] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolve = async () => {
    setIsSolving(true);
    setSolution(null);
    try {
      let result;
      if (selectedImage && imageType) {
        const base64Data = selectedImage.split(',')[1];
        result = await solveExamQuestion(base64Data, imageType);
      } else {
        const prompt = `Explain the mechanism of action of ADH (Antidiuretic Hormone) on the kidney's collecting duct in detail, citing Campbell Biology concepts. Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'}.`;
        result = await generateMedicalResponse(prompt, 'Student Mode');
      }
      setSolution(result || (lang === 'vi' ? "Không có phản hồi." : "No response received."));
      
      // Update radar data slightly to simulate progress
      setRadarData(prev => prev.map(item => 
        item.subject === 'Physiology' ? { ...item, A: Math.min(item.fullMark, item.A + 5) } : item
      ));
    } catch (error) {
      setSolution(lang === 'vi' ? "Lỗi kết nối với BioNexus AI." : "Error connecting to BioNexus AI. Please check your API key.");
    } finally {
      setIsSolving(false);
    }
  };

  const generateLearningPath = async () => {
    setIsGeneratingPath(true);
    try {
      const weakSubject = radarData.reduce((min, p) => p.A < min.A ? p : min, radarData[0]).subject;
      const prompt = `Based on my competency map, my weakest area is ${weakSubject}. 
      Create a personalized learning path for me. Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'}.
      Include:
      1. Specific chapters from Campbell Biology.
      2. 3 practice problem types I should focus on.
      3. A 1-week study schedule.
      4. Links to related concepts in the Bio-Nexus Knowledge Hub.`;
      
      const result = await generateMedicalResponse(prompt, 'Student Mode');
      setLearningPath(result || (lang === 'vi' ? "Không thể tạo lộ trình." : "Unable to generate path."));
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingPath(false);
    }
  };

  const handleResourceClick = async (resource: any) => {
    setSelectedResource(resource);
    setIsLoadingResource(true);
    setResourceContent(null);
    try {
      const prompt = `Provide a detailed study guide for the National Biology Olympiad topic: "${resource.title}". 
      Level: ${resource.level}, Type: ${resource.type}.
      Include:
      1. Key theoretical frameworks.
      2. Common problem-solving patterns.
      3. 2 practice questions with brief hints.
      Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'}. Use Markdown.`;
      const response = await generateMedicalResponse(prompt, 'Scholar Mode');
      setResourceContent(response || "Content not available.");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingResource(false);
    }
  };

  const generateIntensiveQuiz = async () => {
    setIsGeneratingQuiz(true);
    setQuiz(null);
    try {
      const weakSubject = radarData.reduce((min, p) => p.A < min.A ? p : min, radarData[0]).subject;
      const prompt = `Generate an intensive medical/biology quiz for the subject: ${weakSubject}. 
      Include 3 difficult multiple-choice questions with detailed explanations for each answer. 
      Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'}.`;
      const result = await generateMedicalResponse(prompt, 'Student Mode');
      setQuiz(result || (lang === 'vi' ? "Không thể tạo bài kiểm tra." : "Unable to generate quiz."));
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleMentorSend = async () => {
    if (!mentorInput.trim()) return;
    const userMsg = mentorInput.trim();
    const newMessages = [...mentorMessages, { role: 'user' as const, text: userMsg }];
    setMentorMessages(newMessages);
    setMentorInput('');
    setIsMentorThinking(true);
    try {
      const prompt = `You are an AI Academic Mentor for a medical student. 
      The student says: "${userMsg}". 
      Provide guidance, study tips, or explain concepts as a mentor would. 
      Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'}.`;
      const response = await generateMedicalResponse(prompt, 'Student Mode');
      setMentorMessages([...newMessages, { role: 'mentor', text: response || "I'm here to help." }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsMentorThinking(false);
    }
  };

  const startExamSimulation = async (level: 'olympic' | 'hsgqg') => {
    setIsGeneratingExam(true);
    try {
      const { numQuestions, type } = examState.config;
      const prompt = `Generate a high-level biology exam simulation for the ${level === 'olympic' ? 'International Biology Olympiad (IBO)' : 'Vietnam National Gifted Students Exam (HSGQG)'} level.
      The exam should consist of ${numQuestions} ${type === 'mcq' ? 'difficult multiple-choice questions' : 'challenging essay/short-answer questions'}.
      
      Each question must have:
      - A challenging problem statement.
      ${type === 'mcq' ? '- 4 options (A, B, C, D).\n- The index of the correct answer (0-3).' : '- A model answer or key points for grading.'}
      - A detailed explanation of the solution.
      
      Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'}.
      Format the response as a JSON array of objects:
      [
        {
          "question": "...",
          ${type === 'mcq' ? '"options": ["...", "...", "...", "..."],\n"correctAnswer": 0,' : '"correctAnswer": "model answer text",'}
          "explanation": "...",
          "type": "${type}"
        }
      ]`;
      
      const response = await generateMedicalResponse(prompt, 'Student Mode');
      if (response) {
        const jsonStr = response.replace(/```json|```/g, '').trim();
        const questions = JSON.parse(jsonStr);
        
        setExamState(prev => ({
          ...prev,
          isActive: true,
          questions,
          userAnswers: new Array(questions.length).fill(type === 'mcq' ? -1 : ""),
          currentQuestionIndex: 0,
          timeLeft: prev.config.duration * 60,
          isFinished: false
        }));

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setExamState(prev => {
            if (prev.timeLeft <= 0) {
              if (timerRef.current) clearInterval(timerRef.current);
              return { ...prev, isFinished: true };
            }
            return { ...prev, timeLeft: prev.timeLeft - 1 };
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Exam Generation Error:", error);
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const handleAnswerSelect = (answer: number | string) => {
    setExamState(prev => {
      const newAnswers = [...prev.userAnswers];
      newAnswers[prev.currentQuestionIndex] = answer;
      return { ...prev, userAnswers: newAnswers };
    });
  };

  const finishExam = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (examState.config.type === 'essay') {
      setIsGrading(true);
      try {
        const gradingPrompt = `Grade the following essay answers for a ${examState.config.level} biology exam. 
        For each question, provide a score (0-10) and brief feedback.
        Questions and Answers:
        ${examState.questions.map((q, i) => `Q${i+1}: ${q.question}\nStudent Answer: ${examState.userAnswers[i]}\nModel Answer: ${q.correctAnswer}`).join('\n\n')}
        
        Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'} as a JSON array of strings (one feedback per question).`;
        
        const response = await generateMedicalResponse(gradingPrompt, 'Student Mode');
        if (response) {
          const feedback = JSON.parse(response.replace(/```json|```/g, '').trim());
          setEssayFeedback(feedback);
        }
      } catch (error) {
        console.error("Grading Error:", error);
      } finally {
        setIsGrading(false);
      }
    }
    
    setExamState(prev => ({ ...prev, isFinished: true }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      {/* Sub-navigation */}
      <div className="flex gap-4 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm w-fit">
        {[
          { id: 'solver', label: t.examSolver, icon: Brain },
          { id: 'practice', label: t.intensivePractice, icon: BookOpen },
          { id: 'mentor', label: t.learningMentor, icon: MessageSquareText },
          { id: 'simulation', label: t.examSimulation, icon: Trophy },
          { id: 'olympiad', label: lang === 'vi' ? 'Olympic Quốc Gia' : 'National Olympiad', icon: Medal },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeSubTab === tab.id ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'solver' && (
          <motion.div 
            key="solver"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
                <h1 className="text-3xl font-bold mb-2">{t.examSolver}</h1>
                <p className="text-blue-100 mb-6 max-w-md">Upload your biology problems or exam papers. Our AI uses Chain-of-Thought reasoning to guide you to the truth.</p>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-white/20 transition-all overflow-hidden relative",
                    selectedImage && "border-solid bg-white/5"
                  )}
                >
                  {selectedImage ? (
                    <div className="flex items-center gap-4">
                      <img src={selectedImage} alt="Selected" className="w-16 h-16 object-cover rounded-lg border border-white/20" referrerPolicy="no-referrer" />
                      <div className="text-left">
                        <span className="text-sm font-medium block">Image Selected</span>
                        <span className="text-xs opacity-60">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="mb-3" />
                      <span className="text-sm font-medium">{t.dropFile}</span>
                      <span className="text-xs opacity-60 mt-1">Supports Campbell Biology diagrams</span>
                    </>
                  )}
                </div>
                
                <button 
                  onClick={handleSolve}
                  disabled={isSolving}
                  className="mt-6 w-full py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSolving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      {t.analyzing}
                    </>
                  ) : (
                    <>
                      <Brain size={20} />
                      {selectedImage ? t.solveImage : t.solveSample}
                    </>
                  )}
                </button>
              </div>

              <div className="w-full md:w-80 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-600" />
                  {t.competencyMap}
                </h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#E2E8F0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Radar
                        name="Student"
                        dataKey="A"
                        stroke="#2563EB"
                        fill="#3B82F6"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Weakest:</span>
                    <span className="font-bold text-red-500">{radarData.reduce((min, p) => p.A < min.A ? p : min, radarData[0]).subject}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Strongest:</span>
                    <span className="font-bold text-emerald-500">{radarData.reduce((max, p) => p.A > max.A ? p : max, radarData[0]).subject}</span>
                  </div>
                </div>
                <button 
                  onClick={generateLearningPath}
                  disabled={isGeneratingPath}
                  className="mt-4 w-full py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  {isGeneratingPath ? 'Generating...' : t.personalizedPath}
                </button>
              </div>
            </div>

            {/* Learning Path Display */}
            {learningPath && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{t.personalizedPath}</h2>
                      <p className="text-sm text-slate-400">Optimized for your current competency map</p>
                    </div>
                  </div>
                  <button onClick={() => setLearningPath(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <div className="prose prose-invert max-w-none text-slate-300 text-sm markdown-body">
                  <MarkdownRenderer content={learningPath} />
                </div>
              </motion.div>
            )}

            {/* Solution Display */}
            {solution && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{t.verifiedSolution}</h2>
                    <p className="text-sm text-slate-500">AI-Generated • Verified by BioNexus Knowledge Hub</p>
                  </div>
                </div>
                
                <div className="prose prose-slate max-w-none">
                  <div className="text-slate-700 leading-relaxed markdown-body">
                    <MarkdownRenderer content={solution} />
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium cursor-help hover:bg-blue-100 transition-colors">
                    <Lightbulb size={16} />
                    Deep Learning Tooltip: Aquaporins
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-full text-sm font-medium cursor-pointer hover:bg-slate-100 transition-colors">
                    <FileText size={16} />
                    Related Case: Diabetes Insipidus
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeSubTab === 'practice' && (
          <motion.div 
            key="practice"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t.practiceLab}</h2>
                    <p className="text-sm text-slate-500">Intensive exercises tailored to your weaknesses</p>
                  </div>
                </div>
                <button 
                  onClick={generateIntensiveQuiz}
                  disabled={isGeneratingQuiz}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {isGeneratingQuiz ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : <Sparkles size={18} />}
                  {t.generateQuiz}
                </button>
              </div>

              {quiz ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="prose prose-slate max-w-none bg-slate-50 p-8 rounded-3xl border border-slate-100 markdown-body"
                >
                  <MarkdownRenderer content={quiz} />
                </motion.div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <Dna size={48} className="mb-4 opacity-20 animate-pulse" />
                  <p className="text-sm font-medium">Ready to push your limits? Generate a quiz based on your competency map.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeSubTab === 'mentor' && (
          <motion.div 
            key="mentor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[600px] overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <BrainCircuit size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{t.mentorTitle}</h3>
                <p className="text-xs text-slate-500">{t.mentorSubtitle}</p>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {mentorMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-12">
                  <MessageSquareText size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium">Hello! I'm your BioNexus Academic Mentor. How can I assist your medical studies today?</p>
                </div>
              )}
              {mentorMessages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === 'user' && "justify-end")}>
                  {msg.role === 'mentor' && <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-xs">M</div>}
                  <div className={cn(
                    "p-4 rounded-2xl text-sm max-w-[80%]",
                    msg.role === 'mentor' ? "bg-slate-100 rounded-tl-none text-slate-700" : "bg-blue-600 rounded-tr-none text-white"
                  )}>
                    <div className="markdown-body">
                      <MarkdownRenderer content={msg.text} />
                    </div>
                  </div>
                  {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 font-bold text-xs">YOU</div>}
                </div>
              ))}
              {isMentorThinking && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 animate-pulse"></div>
                  <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <input 
                type="text" 
                value={mentorInput}
                onChange={(e) => setMentorInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMentorSend()}
                placeholder={t.askMentor} 
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button 
                onClick={handleMentorSend}
                disabled={isMentorThinking}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Send size={16} />
                {t.send}
              </button>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'olympiad' && (
          <motion.div 
            key="olympiad"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Medal size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{lang === 'vi' ? 'Tài Nguyên Olympic Sinh Học Quốc Gia' : 'National Biology Olympiad Resources'}</h2>
                  <p className="text-sm text-slate-500">Curated materials from HSGQG and International Biology Olympiad</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {t.olympiadResources.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleResourceClick(item)}
                    className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-bold rounded uppercase">{item.level}</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded uppercase">{item.category}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.type}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 group-hover:text-amber-700 transition-colors">{item.title}</h4>
                    <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 font-bold">
                      {t.explore} <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resource Detail Modal */}
            <AnimatePresence>
              {selectedResource && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedResource(null)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[80vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
                  >
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                          <Medal size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-800">{selectedResource.title}</h3>
                          <div className="flex gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-bold rounded uppercase">{selectedResource.level}</span>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded uppercase">{selectedResource.type}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setSelectedResource(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                    </div>
                    
                    <div className="flex-1 p-8 overflow-y-auto">
                      {isLoadingResource ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4">
                          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-slate-500 font-medium">Synthesizing Olympiad Material...</p>
                        </div>
                      ) : (
                        <div className="prose prose-slate max-w-none markdown-body">
                          <MarkdownRenderer content={resourceContent || "No content available."} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        {activeSubTab === 'simulation' && (
          <motion.div 
            key="simulation"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {!examState.isActive ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Trophy size={32} />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold text-slate-800">{t.examTitle}</h2>
                    <p className="text-slate-500">{t.examSubtitle}</p>
                  </div>
                </div>

                <div className="max-w-2xl mx-auto bg-slate-50 rounded-3xl p-8 border border-slate-100 mb-8">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Settings size={18} className="text-blue-600" />
                    {t.examConfig}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.numQuestions}</label>
                      <input 
                        type="number" 
                        min="5" max="100"
                        value={isNaN(examState.config.numQuestions) ? '' : examState.config.numQuestions}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setExamState(prev => ({ ...prev, config: { ...prev.config, numQuestions: isNaN(val) ? 0 : val } }));
                        }}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.examDuration}</label>
                      <input 
                        type="number" 
                        min="10" max="180"
                        value={isNaN(examState.config.duration) ? '' : examState.config.duration}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setExamState(prev => ({ ...prev, config: { ...prev.config, duration: isNaN(val) ? 0 : val } }));
                        }}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.examType}</label>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setExamState(prev => ({ ...prev, config: { ...prev.config, type: 'mcq' } }))}
                          className={cn(
                            "flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all",
                            examState.config.type === 'mcq' ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-100 text-slate-400 hover:border-slate-200"
                          )}
                        >
                          {t.multipleChoice}
                        </button>
                        <button 
                          onClick={() => setExamState(prev => ({ ...prev, config: { ...prev.config, type: 'essay' } }))}
                          className={cn(
                            "flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all",
                            examState.config.type === 'essay' ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-100 text-slate-400 hover:border-slate-200"
                          )}
                        >
                          {t.essay}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                  <button 
                    onClick={() => startExamSimulation('olympic')}
                    disabled={isGeneratingExam}
                    className="p-6 border border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Sparkles size={20} />
                    </div>
                    <span className="font-bold text-slate-800 block">{t.olympicLevel}</span>
                    <span className="text-xs text-slate-500">IBO Standards</span>
                  </button>
                  <button 
                    onClick={() => startExamSimulation('hsgqg')}
                    disabled={isGeneratingExam}
                    className="p-6 border border-slate-200 rounded-2xl hover:border-teal-500 hover:bg-teal-50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <Trophy size={20} />
                    </div>
                    <span className="font-bold text-slate-800 block">{t.hsgqgLevel}</span>
                    <span className="text-xs text-slate-500">National Standards</span>
                  </button>
                </div>

                {isGeneratingExam && (
                  <div className="mt-8 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-400 font-medium">{t.analyzing}</p>
                  </div>
                )}
              </div>
            ) : examState.isFinished ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-800">{t.review}</h2>
                  <button 
                    onClick={() => setExamState({ ...examState, isActive: false, isFinished: false })}
                    className="flex items-center gap-2 text-blue-600 font-bold hover:underline"
                  >
                    <RotateCcw size={18} />
                    {t.backToDashboard}
                  </button>
                </div>

                {isGrading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-bold text-slate-600">{t.grading}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">{t.score}</span>
                        <span className="text-4xl font-bold text-blue-800">
                          {examState.config.type === 'mcq' 
                            ? `${examState.userAnswers.filter((ans, i) => ans === examState.questions[i].correctAnswer).length} / ${examState.questions.length}`
                            : "AI Graded"
                          }
                        </span>
                      </div>
                      <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">Accuracy</span>
                        <span className="text-4xl font-bold text-emerald-800">
                          {examState.config.type === 'mcq' 
                            ? (examState.questions.length > 0 
                                ? `${Math.round((examState.userAnswers.filter((ans, i) => ans === examState.questions[i].correctAnswer).length / examState.questions.length) * 100)}%`
                                : "0%")
                            : "N/A"
                          }
                        </span>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest block mb-1">Time Used</span>
                        <span className="text-4xl font-bold text-slate-800">{formatTime(examState.config.duration * 60 - examState.timeLeft)}</span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {examState.questions.map((q, i) => (
                        <div key={i} className="p-6 border border-slate-100 rounded-2xl">
                          <div className="flex items-start gap-3 mb-4">
                            <span className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                              examState.config.type === 'mcq' && examState.userAnswers[i] === q.correctAnswer ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                            )}>
                              {i + 1}
                            </span>
                            <h4 className="font-bold text-slate-800">{q.question}</h4>
                          </div>
                          
                          {q.type === 'mcq' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 ml-9">
                              {q.options?.map((opt, optIdx) => (
                                <div 
                                  key={optIdx}
                                  className={cn(
                                    "p-3 rounded-xl text-sm border",
                                    optIdx === q.correctAnswer ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-medium" : 
                                    optIdx === examState.userAnswers[i] ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-slate-50 border-slate-100 text-slate-500"
                                  )}
                                >
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="ml-9 mb-4 space-y-4">
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Your Answer</p>
                                <p className="text-sm text-slate-700">{examState.userAnswers[i] as string || "No answer provided."}</p>
                              </div>
                              {essayFeedback[i] && (
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                  <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">{t.feedback}</p>
                                  <p className="text-sm text-amber-800">{essayFeedback[i]}</p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="ml-9 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Model Answer / Explanation</p>
                            <p className="text-sm text-blue-800">{q.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column: Current Question */}
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-[600px]">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-3xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                        <Timer size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{t.timeLeft}</h3>
                        <p className="text-xs font-bold text-blue-600">{formatTime(examState.timeLeft)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={finishExam}
                      className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-100"
                    >
                      {t.submitExam}
                    </button>
                  </div>

                  <div className="flex-1 p-8">
                    <div className="max-w-3xl mx-auto space-y-8">
                      <div className="space-y-4">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{t.question} {examState.currentQuestionIndex + 1} of {examState.questions.length}</span>
                        <h2 className="text-xl font-bold text-slate-800 leading-relaxed">
                          {examState.questions[examState.currentQuestionIndex].question}
                        </h2>
                      </div>

                      {examState.config.type === 'mcq' ? (
                        <div className="grid grid-cols-1 gap-4">
                          {examState.questions[examState.currentQuestionIndex].options?.map((option, i) => (
                            <button
                              key={i}
                              onClick={() => handleAnswerSelect(i)}
                              className={cn(
                                "p-5 rounded-2xl border-2 text-left transition-all group relative overflow-hidden",
                                examState.userAnswers[examState.currentQuestionIndex] === i 
                                  ? "border-blue-600 bg-blue-50 shadow-md" 
                                  : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                              )}
                            >
                              <div className="flex items-center gap-4 relative z-10">
                                <span className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors",
                                  examState.userAnswers[examState.currentQuestionIndex] === i 
                                    ? "bg-blue-600 text-white" 
                                    : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                                )}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span className={cn(
                                  "font-medium",
                                  examState.userAnswers[examState.currentQuestionIndex] === i ? "text-blue-800" : "text-slate-700"
                                )}>
                                  {option}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <textarea 
                          value={examState.userAnswers[examState.currentQuestionIndex] as string}
                          onChange={(e) => handleAnswerSelect(e.target.value)}
                          placeholder="Type your detailed answer here..."
                          className="w-full h-64 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                        />
                      )}
                    </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 flex justify-between bg-slate-50/50 rounded-b-3xl">
                    <button 
                      disabled={examState.currentQuestionIndex === 0}
                      onClick={() => setExamState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 }))}
                      className="flex items-center gap-2 px-6 py-2 text-slate-500 font-bold hover:text-blue-600 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={20} />
                      Previous
                    </button>
                    <button 
                      disabled={examState.currentQuestionIndex === examState.questions.length - 1}
                      onClick={() => setExamState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }))}
                      className="flex items-center gap-2 px-6 py-2 text-blue-600 font-bold hover:text-blue-700 disabled:opacity-30 transition-colors"
                    >
                      Next
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                {/* Right Column: Question Navigation Grid */}
                <div className="w-full lg:w-80 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 h-fit sticky top-24">
                  <h3 className="font-bold text-slate-800 mb-4">{lang === 'vi' ? 'Danh sách câu hỏi' : 'Question Navigation'}</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {examState.questions.map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => setExamState(prev => ({ ...prev, currentQuestionIndex: i }))}
                        className={cn(
                          "aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all",
                          examState.currentQuestionIndex === i ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2" : 
                          examState.userAnswers[i] !== (examState.config.type === 'mcq' ? -1 : "") ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-6 space-y-3 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-blue-600"></div> {lang === 'vi' ? 'Hiện tại' : 'Current'}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-blue-100"></div> {lang === 'vi' ? 'Đã trả lời' : 'Answered'}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-slate-100"></div> {lang === 'vi' ? 'Chưa trả lời' : 'Unanswered'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Knowledge Graph Section */}
      <KnowledgeGraph lang={lang} />

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {t.recentActivity.map((item, i) => {
          const activityIcons = [Clock, CheckCircle2, AlertCircle];
          const activityTypes = ['olympic', 'quiz', 'lab'];
          const activityScores = ['88/100', '95/100', 'Pending'];
          
          return (
            <button 
              key={i} 
              onClick={() => {
                if (activityTypes[i] === 'olympic') {
                  setActiveSubTab('simulation');
                  startExamSimulation('olympic');
                } else if (activityTypes[i] === 'quiz') {
                  setActiveSubTab('practice');
                  generateIntensiveQuiz();
                } else {
                  setActiveSubTab('solver');
                  handleSolve();
                }
              }}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                  {React.createElement(activityIcons[i], { size: 20, className: "text-slate-400 group-hover:text-blue-600" })}
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-md">{activityScores[i]}</span>
              </div>
              <h4 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{item.title}</h4>
              <p className="text-xs text-slate-400 mt-1">{item.date}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
