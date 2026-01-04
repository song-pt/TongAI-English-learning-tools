
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppMode, WordPair, ContextQuestion, AppSettings, AppTheme, GrammarPracticeData, GrammarSubMode } from './types';
import { fetchWordPairs, fetchContextQuestions, fetchGrammarData, fetchExplanationForError } from './geminiService';
import Button from './components/Button';
import { Settings as SettingsIcon, RotateCcw, CheckCircle2, XCircle, Code, Info, Monitor, Layout, Sliders, Target, BookOpen, ChevronRight, HelpCircle, PenTool, ListChecks, Hash, Sparkles, Loader2 } from 'lucide-react';

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-blue-700 font-extrabold">{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </>
  );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('input');
  const [grammarSubMode, setGrammarSubMode] = useState<GrammarSubMode>('explanation');
  const [userWords, setUserWords] = useState<string>('');
  const [grammarPoint, setGrammarPoint] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [wordPairs, setWordPairs] = useState<WordPair[]>([]);
  const [contextQuestions, setContextQuestions] = useState<ContextQuestion[]>([]);
  const [grammarData, setGrammarData] = useState<GrammarPracticeData | null>(null);
  const [isDev, setIsDev] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('lingo_settings');
    return saved ? JSON.parse(saved) : {
      baseUrl: 'https://generativelanguage.googleapis.com',
      modelName: 'gemini-3-flash-preview',
      allowInflection: false,
      theme: 'duolingo',
      aeroOpacity: 70,
      wordPracticeCount: 5,
      grammarPracticeCount: 5
    };
  });

  useEffect(() => {
    // @ts-ignore
    if (window.aistudio) {
      setIsDev(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lingo_settings', JSON.stringify(settings));
  }, [settings]);

  const startMatching = async () => {
    if (!userWords.trim()) return;
    setIsLoading(true);
    try {
      const pairs = await fetchWordPairs(userWords, settings.modelName);
      const limitedPairs = pairs.slice(0, settings.wordPracticeCount);
      setWordPairs(limitedPairs);
      setMode('matching');
    } catch (error: any) {
      alert(`获取单词失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startContext = async () => {
    if (!userWords.trim()) return;
    setIsLoading(true);
    try {
      const questions = await fetchContextQuestions(userWords, settings.allowInflection, settings.wordPracticeCount, settings.modelName);
      setContextQuestions(questions);
      setMode('context');
    } catch (error: any) {
      alert(`生成题目失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startGrammar = async (targetMode: GrammarSubMode) => {
    if (!grammarPoint.trim()) return;
    setGrammarSubMode(targetMode);
    setIsLoading(true);
    try {
      const data = await fetchGrammarData(grammarPoint, grade, settings.grammarPracticeCount, settings.modelName);
      setGrammarData(data);
      setMode('grammar_practice');
    } catch (error: any) {
      alert(`生成语法练习失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isAero = settings.theme === 'aero';

  return (
    <div className={`min-h-screen flex flex-col items-center p-4 md:p-8 relative transition-all duration-700 ${
      isAero 
        ? "bg-gradient-to-br from-[#74ebd5] to-[#9face6] bg-fixed font-sans" 
        : "bg-[#f7f7f7] font-['Nunito']"
    }`}>
      {isAero && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/4 -right-20 w-80 h-80 bg-blue-300/30 rounded-full blur-3xl" />
        </div>
      )}

      {isDev && (
        <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm z-50 transition-all ${
          isAero 
            ? "bg-white/70 backdrop-blur-md text-black border-white/50" 
            : "bg-[#e5ffcc] text-[#58cc02] border-[#58cc02]/30"
        }`}>
          <Code size={12} />
          开发模式
        </div>
      )}

      <header className="w-full max-w-2xl flex justify-between items-center mb-8 z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMode('input')}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-md transition-all ${
            isAero ? "bg-white/70 backdrop-blur-md border border-white/50 text-black" : "bg-[#58cc02]"
          }`}>T</div>
          <h1 className={`text-2xl font-black ${isAero ? "text-black drop-shadow-md" : "text-[#58cc02]"}`}>Tonglanguage AI</h1>
        </div>
        <button 
          onClick={() => setMode('settings')} 
          className={`p-2 transition-all hover:rotate-90 ${isAero ? "text-black hover:opacity-70" : "text-gray-400 hover:text-gray-600"}`}
        >
          <SettingsIcon size={24} />
        </button>
      </header>

      <main className="w-full max-w-2xl flex-grow z-10">
        <div className={`transition-all duration-500 ${
          isAero 
            ? "backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.2)] p-1 overflow-hidden" 
            : ""
        }`}>
          {mode === 'input' && (
            <InputSection 
              userWords={userWords} 
              setUserWords={setUserWords} 
              onMatch={startMatching} 
              onContext={startContext}
              onGoGrammar={() => setMode('grammar_input')}
              isLoading={isLoading}
              settings={settings}
            />
          )}
          {mode === 'grammar_input' && (
            <GrammarInputSection 
              grammarPoint={grammarPoint}
              setGrammarPoint={setGrammarPoint}
              grade={grade}
              setGrade={setGrade}
              onStart={startGrammar}
              onBack={() => setMode('input')}
              isLoading={isLoading}
              settings={settings}
            />
          )}
          {mode === 'grammar_practice' && grammarData && (
            <GrammarPracticeSection 
              data={grammarData}
              subMode={grammarSubMode}
              onReset={() => setMode('grammar_input')}
              settings={settings}
            />
          )}
          {mode === 'matching' && (
            <MatchingSection 
              pairs={wordPairs} 
              onReset={() => setMode('input')} 
              settings={settings}
            />
          )}
          {mode === 'context' && (
            <ContextSection 
              questions={contextQuestions} 
              onRefresh={startContext}
              onReset={() => setMode('input')}
              isLoading={isLoading}
              settings={settings}
            />
          )}
          {mode === 'settings' && (
            <SettingsSection 
              settings={settings} 
              setSettings={setSettings} 
              onClose={() => setMode('input')} 
              isDev={isDev}
            />
          )}
        </div>
      </main>
    </div>
  );
};

const InputSection: React.FC<{ 
  userWords: string, 
  setUserWords: (s: string) => void, 
  onMatch: () => void, 
  onContext: () => void,
  onGoGrammar: () => void,
  isLoading: boolean,
  settings: AppSettings
}> = ({ userWords, setUserWords, onMatch, onContext, onGoGrammar, isLoading, settings }) => {
  const isAero = settings.theme === 'aero';
  return (
    <div className={`p-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden ${
      isAero ? "text-black" : "bg-white rounded-3xl shadow-sm border-2 border-gray-100"
    }`}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center animate-in fade-in duration-300 ${isAero ? 'bg-white/40 backdrop-blur-md' : 'bg-white/80 backdrop-blur-sm'}`}>
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <Loader2 className={`w-12 h-12 animate-spin ${isAero ? 'text-blue-600' : 'text-[#58cc02]'}`} />
            <div className="space-y-1">
              <p className="text-xl font-black text-gray-800">Tonglanguage AI 正在思考...</p>
              <p className="text-sm font-bold text-gray-500">正在为你精心构建单词练习题目</p>
            </div>
          </div>
        </div>
      )}

      <h2 className={`text-xl font-extrabold ${isAero ? "text-black" : "text-gray-700"}`}>输入单词列表</h2>
      <p className={`-mt-4 text-sm ${isAero ? "text-black/70" : "text-gray-500"}`}>请用逗号或空格分隔。我们将为你自动构建练习。</p>
      <textarea
        className={`w-full h-40 p-4 rounded-2xl border-2 focus:outline-none text-lg resize-none transition-all ${
          isAero 
            ? "bg-white/70 border-white/50 focus:bg-white/80 focus:border-black/30 text-black placeholder-black/40 backdrop-blur-sm" 
            : "bg-white border-gray-200 focus:border-[#1cb0f6]"
        }`}
        placeholder="例如: apple, banana, water, computer..."
        value={userWords}
        onChange={(e) => setUserWords(e.target.value)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button onClick={onMatch} disabled={isLoading} fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity}>
          单词连线
        </Button>
        <Button onClick={onContext} variant="secondary" disabled={isLoading} fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity}>
          语境填空
        </Button>
      </div>
      <div className="pt-4 border-t border-dashed border-gray-300">
        <Button onClick={onGoGrammar} variant="ghost" fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity} className="border-2 border-blue-400 text-blue-600 hover:bg-blue-50">
          <BookOpen size={20} /> 进入语法练习模式
        </Button>
      </div>
    </div>
  );
};

const GrammarInputSection: React.FC<{
  grammarPoint: string,
  setGrammarPoint: (s: string) => void,
  grade: string,
  setGrade: (s: string) => void,
  onStart: (m: GrammarSubMode) => void,
  onBack: () => void,
  isLoading: boolean,
  settings: AppSettings
}> = ({ grammarPoint, setGrammarPoint, grade, setGrade, onStart, onBack, isLoading, settings }) => {
  const isAero = settings.theme === 'aero';
  return (
    <div className={`p-8 flex flex-col gap-6 animate-in fade-in slide-in-from-left-4 duration-500 ${
      isAero ? "text-black" : "bg-white rounded-3xl shadow-sm border-2 border-gray-100"
    }`}>
      <h2 className={`text-xl font-extrabold ${isAero ? "text-black" : "text-gray-700"} flex items-center gap-2`}>
        <BookOpen className="text-blue-500" /> 语法练习中心
      </h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1 opacity-70">语法点名称</label>
            <input 
              type="text" 
              className={`w-full p-4 rounded-xl border-2 focus:outline-none font-bold transition-all ${
                isAero ? "bg-white/70 border-white/40 text-black placeholder-black/30" : "bg-white border-gray-200"
              }`}
              placeholder="例如：现在完成时"
              value={grammarPoint}
              onChange={(e) => setGrammarPoint(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 opacity-70">适用年级</label>
            <input 
              type="text" 
              className={`w-full p-4 rounded-xl border-2 focus:outline-none font-bold transition-all ${
                isAero ? "bg-white/70 border-white/40 text-black placeholder-black/30" : "bg-white border-gray-200"
              }`}
              placeholder="例如：七年级"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-4">
        <Button onClick={() => onStart('explanation')} disabled={isLoading || !grammarPoint.trim()} fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity} variant="primary">
          <BookOpen size={18} /> 理解语法 (AI 讲解)
        </Button>
        <Button onClick={() => onStart('fill')} variant="secondary" disabled={isLoading || !grammarPoint.trim()} fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity}>
          <PenTool size={18} /> 语法填空实战
        </Button>
        <Button onClick={() => onStart('choice')} variant="ghost" disabled={isLoading || !grammarPoint.trim()} fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity} className="border-2 border-cyan-400 text-cyan-600">
          <ListChecks size={18} /> 语法选择实战
        </Button>
      </div>
      
      {isLoading && (
        <div className="text-center p-4 animate-pulse font-bold text-blue-500">
          AI 正在准备教材与题目...
        </div>
      )}

      <button onClick={onBack} className="text-sm font-bold opacity-50 hover:opacity-100 py-2 transition-opacity">进入单词练习模式</button>
    </div>
  );
};

const GrammarPracticeSection: React.FC<{
  data: GrammarPracticeData,
  subMode: GrammarSubMode,
  onReset: () => void,
  settings: AppSettings
}> = ({ data, subMode, onReset, settings }) => {
  const [fillIndex, setFillIndex] = useState(0);
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showToast, setShowToast] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const isAero = settings.theme === 'aero';

  const handleFillCheck = () => {
    const isCorrect = userInput.trim().toLowerCase() === data.fillQuestions[fillIndex].answer.toLowerCase();
    if (isCorrect) {
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const handleNextFill = () => {
    setShowToast(false);
    setAiExplanation(null);
    if (fillIndex < data.fillQuestions.length - 1) {
      setFillIndex(fillIndex + 1);
      setUserInput('');
      setFeedback('idle');
    } else {
      alert("填空练习完成！");
      onReset();
    }
  };

  const handleChoiceSelect = (opt: string) => {
    if (feedback !== 'idle') return;
    setSelectedOption(opt);
    const isCorrect = opt === data.choiceQuestions[choiceIndex].answer;
    if (isCorrect) {
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const handleNextChoice = () => {
    setShowToast(false);
    setAiExplanation(null);
    setSelectedOption(null);
    if (choiceIndex < data.choiceQuestions.length - 1) {
      setChoiceIndex(choiceIndex + 1);
      setFeedback('idle');
    } else {
      alert("选择练习完成！");
      onReset();
    }
  };

  const handleAskAI = async () => {
    setIsExplaining(true);
    try {
      let sentence = '', correct = '', wrong = '';
      if (subMode === 'fill') {
        sentence = data.fillQuestions[fillIndex].sentence;
        correct = data.fillQuestions[fillIndex].answer;
        wrong = userInput;
      } else {
        sentence = data.choiceQuestions[choiceIndex].sentence;
        correct = data.choiceQuestions[choiceIndex].answer;
        wrong = selectedOption || '未选择';
      }
      const explanation = await fetchExplanationForError(sentence, correct, wrong, settings.modelName);
      setAiExplanation(explanation);
    } catch (e) {
      setAiExplanation('获取分析失败，请检查网络连接。');
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className={`p-6 flex flex-col gap-6 relative transition-all duration-300 ${isAero ? "text-black" : "bg-white rounded-3xl"}`}>
      {showToast && (
        <div className="absolute top-0 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none">
          <button 
            onClick={() => setShowToast(false)}
            className={`mt-4 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 pointer-events-auto transition-all ${
              isAero 
                ? "bg-white/80 backdrop-blur-md border border-red-200 text-black" 
                : "bg-red-50 border-2 border-red-200 text-red-700"
            }`}
          >
            <XCircle className="text-red-500 shrink-0" size={24} />
            <div className="text-left">
              <p className="font-black text-sm uppercase opacity-60">答错了</p>
              <p className="text-lg font-bold">正确答案: <span className="underline decoration-red-500">
                {subMode === 'fill' ? data.fillQuestions[fillIndex].answer : data.choiceQuestions[choiceIndex].answer}
              </span></p>
            </div>
            <XCircle size={16} className="ml-4 opacity-40" />
          </button>
        </div>
      )}

      <div className="min-h-[300px] flex flex-col">
        {subMode === 'explanation' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            <h3 className="text-2xl font-black">{data.explanation.title}</h3>
            <div className={`p-4 rounded-2xl ${isAero ? "bg-white/40" : "bg-blue-50"} space-y-2`}>
              <p className="font-bold text-sm text-blue-600 uppercase tracking-widest">核心用法</p>
              <p className="leading-relaxed whitespace-pre-wrap">{data.explanation.usage}</p>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-sm opacity-50 uppercase tracking-widest">经典例句</p>
              <ul className="space-y-2">
                {data.explanation.examples.map((ex, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-blue-500 font-bold">{i+1}.</span>
                    <span className="font-bold">{ex}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`p-4 rounded-2xl ${isAero ? "bg-white/20" : "bg-gray-50"} space-y-2 border-l-4 border-gray-300`}>
              <p className="font-bold text-sm opacity-50 flex items-center gap-1"><HelpCircle size={14}/> 小贴士</p>
              <p className="text-sm italic">{data.explanation.comparisons}</p>
            </div>
            <Button onClick={onReset} fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity} className="mt-4">
              返回并尝试练习
            </Button>
          </div>
        )}

        {subMode === 'fill' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="flex justify-between items-center text-xs font-black opacity-50">
               <span>填空实战模式</span>
               <span>{fillIndex + 1} / {data.fillQuestions.length}</span>
            </div>
            <div className="p-6 rounded-2xl bg-black/5 text-center">
               <h2 className="text-2xl font-bold leading-relaxed">
                {data.fillQuestions[fillIndex].sentence.split('_____').map((p, i, arr) => (
                  <React.Fragment key={i}>
                    {p}{i < arr.length - 1 && <span className="inline-block border-b-2 border-blue-500 px-4 mx-1 min-w-[3rem] h-2"></span>}
                  </React.Fragment>
                ))}
              </h2>
              <div className="mt-4 text-blue-600 font-black text-lg">提示词: ({data.fillQuestions[fillIndex].hint})</div>
            </div>
            
            <input 
              type="text" 
              className={`w-full p-4 text-xl font-bold rounded-2xl border-2 focus:outline-none transition-all ${
                isAero ? "bg-white/70 border-white/40 text-black placeholder-black/30" : "bg-white border-gray-200 focus:border-blue-400"
              }`}
              placeholder="在这里输入正确形式的单词..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              readOnly={feedback !== 'idle'}
              onKeyDown={(e) => e.key === 'Enter' && (feedback === 'idle' ? userInput.trim() && handleFillCheck() : handleNextFill())}
              autoFocus
            />
            {feedback === 'idle' ? (
              <Button onClick={handleFillCheck} fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity} disabled={!userInput.trim()}>检查答案 (Enter)</Button>
            ) : (
              <div className="flex flex-col gap-4">
                <div className={`p-4 rounded-2xl flex flex-col gap-3 animate-in slide-in-from-top-2 ${feedback === 'correct' ? "bg-green-500/20" : "bg-red-500/20"}`}>
                  <div className="font-black flex items-center gap-2">
                    {feedback === 'correct' ? <CheckCircle2 className="text-green-600"/> : <XCircle className="text-red-600"/>}
                    {feedback === 'correct' ? '做得好！' : '已经收录答案'}
                  </div>
                  <Button onClick={handleNextFill} variant={feedback === 'correct' ? 'primary' : 'danger'} fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity}>
                    {fillIndex < data.fillQuestions.length - 1 ? '下一题 (Enter)' : '结束本次练习'}
                  </Button>
                </div>
                
                {feedback === 'incorrect' && !aiExplanation && (
                  <Button variant="secondary" fullWidth onClick={handleAskAI} disabled={isExplaining} theme={settings.theme} aeroOpacity={settings.aeroOpacity} className="text-white">
                    {isExplaining ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} 问 AI 为什么错了？
                  </Button>
                )}

                {aiExplanation && (
                  <div className={`p-5 rounded-2xl border-2 animate-in zoom-in duration-300 ${isAero ? "bg-white/40 border-white/50" : "bg-blue-50 border-blue-100"}`}>
                    <div className="flex items-center gap-2 mb-2 text-blue-600 font-black">
                      <Sparkles size={16} /> AI 错因分析
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700 font-semibold">
                      <FormattedText text={aiExplanation} />
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {subMode === 'choice' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
             <div className="flex justify-between items-center text-xs font-black opacity-50">
               <span>选择挑战模式</span>
               <span>{choiceIndex + 1} / {data.choiceQuestions.length}</span>
            </div>
            <div className="p-6 rounded-2xl bg-black/5 text-center">
              <h2 className="text-2xl font-bold leading-relaxed">
                {data.choiceQuestions[choiceIndex].sentence.split('_____').map((p, i, arr) => (
                  <React.Fragment key={i}>
                    {p}{i < arr.length - 1 && <span className="inline-block border-b-2 border-blue-500 px-4 mx-1 min-w-[3rem] h-2"></span>}
                  </React.Fragment>
                ))}
              </h2>
            </div>
            
            <div className="flex flex-col gap-3">
              {data.choiceQuestions[choiceIndex].options.map((opt, i) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt === data.choiceQuestions[choiceIndex].answer;
                
                let btnStyle = isAero ? "bg-white/50 border-white/30 text-black" : "bg-white border-gray-200 text-gray-700";
                if (feedback !== 'idle') {
                  if (isCorrect) btnStyle = "bg-green-500/30 border-green-500 text-green-900";
                  else if (isSelected) btnStyle = "bg-red-500/30 border-red-500 text-red-900";
                  else btnStyle = "opacity-30";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleChoiceSelect(opt)}
                    className={`w-full p-4 rounded-2xl border-2 font-bold text-lg text-left transition-all flex justify-between items-center ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {feedback !== 'idle' && isCorrect && <CheckCircle2 size={20}/>}
                  </button>
                );
              })}
            </div>

            {feedback !== 'idle' && (
              <div className="flex flex-col gap-4">
                <Button onClick={handleNextChoice} fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity}>
                   {choiceIndex < data.choiceQuestions.length - 1 ? '下一题' : '完成本次练习'}
                </Button>
                
                {feedback === 'incorrect' && !aiExplanation && (
                  <Button variant="secondary" fullWidth onClick={handleAskAI} disabled={isExplaining} theme={settings.theme} aeroOpacity={settings.aeroOpacity} className="text-white">
                    {isExplaining ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} 问 AI 为什么错了？
                  </Button>
                )}

                {aiExplanation && (
                  <div className={`p-5 rounded-2xl border-2 animate-in zoom-in duration-300 ${isAero ? "bg-white/40 border-white/50" : "bg-blue-50 border-blue-100"}`}>
                    <div className="flex items-center gap-2 mb-2 text-blue-600 font-black">
                      <Sparkles size={16} /> AI 错因分析
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700 font-semibold">
                      <FormattedText text={aiExplanation} />
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <button onClick={onReset} className="mt-4 text-xs font-bold opacity-30 hover:opacity-100 flex items-center gap-1 justify-center transition-opacity">
        <RotateCcw size={12}/> 放弃并重新设置语法点
      </button>
    </div>
  );
};

const MatchingSection: React.FC<{ pairs: WordPair[], onReset: () => void, settings: AppSettings }> = ({ pairs, onReset, settings }) => {
  const [leftCol, setLeftCol] = useState<WordPair[]>([]);
  const [rightCol, setRightCol] = useState<WordPair[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ id: string, type: 'correct' | 'error' } | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const isAero = settings.theme === 'aero';

  const shuffle = useCallback(() => {
    setLeftCol([...pairs].sort(() => Math.random() - 0.5));
    setRightCol([...pairs].sort(() => Math.random() - 0.5));
    setMatchedIds(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
  }, [pairs]);

  useEffect(() => {
    shuffle();
  }, [shuffle]);

  const handleLeftClick = (p: WordPair) => {
    if (matchedIds.has(p.id) || feedback) return;
    setSelectedLeft(p.id);
    if (selectedRight) checkMatch(p.id, selectedRight);
  };

  const handleRightClick = (p: WordPair) => {
    if (matchedIds.has(p.id) || feedback) return;
    setSelectedRight(p.id);
    if (selectedLeft) checkMatch(selectedLeft, p.id);
  };

  const checkMatch = (leftId: string, rightId: string) => {
    if (leftId === rightId) {
      setFeedback({ id: leftId, type: 'correct' });
      setTimeout(() => {
        setMatchedIds(prev => new Set(prev).add(leftId));
        setFeedback(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 600);
    } else {
      setFeedback({ id: leftId, type: 'error' });
      const correctWord = pairs.find(p => p.id === leftId);
      setErrorInfo(`答错了！ ${correctWord?.en} 的意思是 ${correctWord?.cn}`);
    }
  };

  if (matchedIds.size === pairs.length && pairs.length > 0) {
    return (
      <div className={`p-12 text-center flex flex-col items-center gap-6 animate-in zoom-in duration-300 ${isAero ? "" : "bg-white rounded-3xl shadow-sm"}`}>
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${isAero ? "bg-white/70 backdrop-blur-md border border-white/50 text-black" : "bg-[#58cc02]"}`}>
          <CheckCircle2 size={64} />
        </div>
        <h2 className={`text-3xl font-black ${isAero ? "text-black drop-shadow-md" : "text-gray-800"}`}>完美通关！</h2>
        <p className={`text-lg ${isAero ? "text-black/80" : "text-gray-500"}`}>你已经成功匹配了所有单词。</p>
        <div className="flex gap-4 w-full">
          <Button onClick={shuffle} fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity}>再来一局</Button>
          <Button variant="ghost" onClick={onReset} fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity}>退出</Button>
        </div>
      </div>
    );
  }

  const opacityValue = settings.aeroOpacity / 100;

  return (
    <div className={`p-6 space-y-6`}>
      <div className={`flex justify-between items-center p-4 rounded-2xl border mb-4 transition-all ${
        isAero ? "bg-white/70 backdrop-blur-md border-white/30 text-black" : "bg-white border-gray-100 text-gray-600"
      }`}>
        <h2 className="text-lg font-bold">词义配对</h2>
        <span className={`text-sm font-bold ${isAero ? "text-black/60" : "text-[#1cb0f6]"}`}>{matchedIds.size} / {pairs.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-8">
        <div className="space-y-3">
          {leftCol.map(p => {
            const isMatched = matchedIds.has(p.id);
            const isSelected = selectedLeft === p.id;
            const isCurrentFeedback = feedback?.id === p.id;
            
            let btnClass = isAero ? "border-white/30 text-black" : "bg-white border-gray-200 text-gray-700";
            let dynamicStyle: any = isAero ? { backgroundColor: `rgba(255, 255, 255, ${opacityValue})` } : {};
            
            if (isMatched) {
                btnClass = isAero ? "border-white/10 text-black/40" : "bg-gray-100 border-gray-200 text-gray-300 opacity-50";
                if (isAero) dynamicStyle = { backgroundColor: `rgba(255, 255, 255, ${opacityValue * 0.4})` };
            } else if (isSelected) {
                btnClass = isAero ? "border-blue-200 text-black shadow-inner" : "bg-[#ddf4ff] border-[#1cb0f6] text-[#1cb0f6]";
                if (isAero) dynamicStyle = { backgroundColor: `rgba(59, 130, 246, 0.5)` };
            }
            
            if (isCurrentFeedback) {
              if (feedback.type === 'correct') {
                btnClass = isAero ? "border-green-200 text-black" : "bg-[#e5ffcc] border-[#58cc02] text-[#58cc02]";
                if (isAero) dynamicStyle = { backgroundColor: `rgba(34, 197, 94, 0.7)` };
              } else {
                btnClass = isAero ? "border-red-200 text-black" : "bg-[#ffdfdf] border-[#ff4b4b] text-[#ff4b4b]";
                if (isAero) dynamicStyle = { backgroundColor: `rgba(239, 68, 68, 0.7)` };
              }
            }

            return (
              <button 
                key={p.id} 
                onClick={() => handleLeftClick(p)} 
                disabled={isMatched} 
                style={dynamicStyle}
                className={`w-full p-4 rounded-2xl border-b-4 text-center font-bold text-lg transition-all ${btnClass} ${isAero ? "backdrop-blur-sm" : ""}`}
              >
                {p.en}
              </button>
            );
          })}
        </div>
        <div className="space-y-3">
          {rightCol.map(p => {
            const isMatched = matchedIds.has(p.id);
            const isSelected = selectedRight === p.id;
            const isCorrectPartner = feedback?.type === 'correct' && feedback.id === p.id;
            
            let btnClass = isAero ? "border-white/30 text-black" : "bg-white border-gray-200 text-gray-700";
            let dynamicStyle: any = isAero ? { backgroundColor: `rgba(255, 255, 255, ${opacityValue})` } : {};

            if (isMatched) {
                btnClass = isAero ? "border-white/10 text-black/40" : "bg-gray-100 border-gray-200 text-gray-300 opacity-50";
                if (isAero) dynamicStyle = { backgroundColor: `rgba(255, 255, 255, ${opacityValue * 0.4})` };
            } else if (isSelected) {
                btnClass = isAero ? "border-blue-200 text-black shadow-inner" : "bg-[#ddf4ff] border-[#1cb0f6] text-[#1cb0f6]";
                if (isAero) dynamicStyle = { backgroundColor: `rgba(59, 130, 246, 0.5)` };
            }
            
            if (isCorrectPartner) {
                btnClass = isAero ? "border-green-200 text-black" : "bg-[#e5ffcc] border-[#58cc02] text-[#58cc02]";
                if (isAero) dynamicStyle = { backgroundColor: `rgba(34, 197, 94, 0.7)` };
            }

            return (
              <button 
                key={p.id} 
                onClick={() => handleRightClick(p)} 
                disabled={isMatched} 
                style={dynamicStyle}
                className={`w-full p-4 rounded-2xl border-b-4 text-center font-bold text-lg transition-all ${btnClass} ${isAero ? "backdrop-blur-sm" : ""}`}
              >
                {p.cn}
              </button>
            );
          })}
        </div>
      </div>

      {errorInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`p-8 rounded-3xl max-w-sm w-full text-center space-y-6 animate-in fade-in zoom-in duration-200 transition-all ${
            isAero ? "bg-white/70 backdrop-blur-2xl border border-white/40 shadow-2xl text-black" : "bg-white shadow-xl"
          }`}>
            <XCircle className={`mx-auto ${isAero ? "text-red-600" : "text-[#ff4b4b]"}`} size={64} />
            <h3 className={`text-2xl font-black ${isAero ? "text-black" : "text-gray-800"}`}>哎呀！</h3>
            <p className={`${isAero ? "text-black/90" : "text-gray-600"} text-lg font-bold`}>{errorInfo}</p>
            <Button onClick={() => { setErrorInfo(null); setFeedback(null); setSelectedLeft(null); setSelectedRight(null); }} variant="danger" fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity}>继续练习</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const ContextSection: React.FC<{ 
  questions: ContextQuestion[], 
  onRefresh: () => void, 
  onReset: () => void,
  isLoading: boolean,
  settings: AppSettings
}> = ({ questions, onRefresh, onReset, isLoading, settings }) => {
  const [index, setIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  
  const isAero = settings.theme === 'aero';
  const q = questions[index];

  const handleCheck = () => {
    const isCorrect = userInput.trim().toLowerCase() === q.answer.toLowerCase();
    setAttemptedCount(prev => prev + 1);
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setStatus('correct');
    } else {
      setStatus('incorrect');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const handleNext = () => {
    setShowToast(false);
    setAiExplanation(null);
    if (index < questions.length - 1) {
      setIndex(index + 1);
      setUserInput('');
      setStatus('idle');
    } else {
      setStatus('idle');
      onRefresh();
      setIndex(0);
      setUserInput('');
    }
  };

  const handleAskAI = async () => {
    setIsExplaining(true);
    try {
      const explanation = await fetchExplanationForError(q.sentence, q.answer, userInput, settings.modelName);
      setAiExplanation(explanation);
    } catch (e) {
      setAiExplanation('获取分析失败，请检查网络连接。');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (status === 'idle') {
        if (userInput.trim()) handleCheck();
      } else {
        handleNext();
      }
    }
  };

  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  if (!questions.length) return <div className="text-center p-8">未生成题目，请重试。</div>;

  return (
    <div className={`p-8 space-y-8 relative transition-all duration-300 ${isAero ? "text-black" : "bg-white rounded-3xl"}`}>
      {/* Loading overlay for refresh */}
      {isLoading && (
        <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center animate-in fade-in duration-300 rounded-3xl ${isAero ? 'bg-white/40 backdrop-blur-md' : 'bg-white/80 backdrop-blur-sm'}`}>
          <Loader2 className={`w-12 h-12 animate-spin ${isAero ? 'text-blue-600' : 'text-[#58cc02]'}`} />
          <p className="mt-4 text-lg font-black text-gray-800">正在换一批题目...</p>
        </div>
      )}

      {showToast && (
        <div className="absolute top-0 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none">
          <button 
            onClick={() => setShowToast(false)}
            className={`mt-4 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 pointer-events-auto transition-all ${
              isAero 
                ? "bg-white/80 backdrop-blur-md border border-red-200 text-black" 
                : "bg-red-50 border-2 border-red-200 text-red-700"
            }`}
          >
            <XCircle className="text-red-500 shrink-0" size={24} />
            <div className="text-left">
              <p className="font-black text-sm uppercase opacity-60">哎呀，答错了！</p>
              <p className="text-lg font-bold">正确答案是: <span className="underline decoration-red-500">{q.answer}</span></p>
            </div>
            <XCircle size={16} className="ml-4 opacity-40" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-2">
         <div className={`flex items-center gap-2 font-black text-sm uppercase tracking-widest ${isAero ? "text-black/60" : "text-gray-400"}`}>
           <Target size={16} /> 准确率: <span className={isAero ? "text-black" : "text-[#58cc02]"}>{accuracy}%</span>
         </div>
         <span className={`text-sm font-black uppercase tracking-widest ${isAero ? "text-black/60" : "text-gray-400"}`}>第 {index + 1} / {questions.length} 题</span>
      </div>

      <div className={`w-full h-4 rounded-full overflow-hidden transition-all ${isAero ? "bg-white/40" : "bg-gray-100"}`}>
        <div className={`h-full transition-all duration-500 ${isAero ? "bg-blue-600 shadow-[0_0_10px_white]" : "bg-[#58cc02]"}`} style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="space-y-4">
        <h2 className={`text-2xl font-bold leading-relaxed ${isAero ? "text-black drop-shadow-sm" : "text-gray-800"}`}>
          {q.sentence.split('_____').map((part, i, arr) => (
            <React.Fragment key={i}>
              {part}
              {i < arr.length - 1 && <span className={`inline-block border-b-2 w-24 mx-2 ${isAero ? "border-black/50" : "border-gray-300"}`}></span>}
            </React.Fragment>
          ))}
        </h2>
      </div>

      <div className="space-y-4">
        <input 
          type="text" 
          className={`w-full p-4 text-xl font-bold rounded-2xl border-2 focus:outline-none transition-all ${
            isAero ? "bg-white/70 border-white/40 focus:bg-white/90 text-black placeholder-black/40" : "bg-white border-gray-200 focus:border-[#1cb0f6]"
          }`} 
          placeholder="输入单词..." 
          value={userInput} 
          onChange={(e) => setUserInput(e.target.value)} 
          readOnly={status !== 'idle'} 
          onKeyDown={handleKeyDown}
          autoFocus
        />
        
        {status === 'idle' ? (
          <Button onClick={handleCheck} fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity}>检查答案 (Enter)</Button>
        ) : (
          <div className="flex flex-col gap-4">
            <div className={`p-6 rounded-2xl flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300 ${
              status === 'correct' 
                ? (isAero ? "bg-green-500/30 border border-green-200/50 text-black" : "bg-[#e5ffcc] text-[#58cc02]") 
                : (isAero ? "bg-red-500/30 border border-red-200/50 text-black" : "bg-[#ffdfdf] text-[#ff4b4b]")
            }`}>
              <div className={`flex items-center gap-2 font-black text-xl`}>
                {status === 'correct' ? <CheckCircle2 /> : <XCircle />}
                {status === 'correct' ? '做得好！' : '已经收录答案'}
              </div>
              {status === 'correct' && <div className="text-sm opacity-70">你答对了这一题，按下 Enter 继续。</div>}
              <Button onClick={handleNext} variant={status === 'correct' ? 'primary' : 'danger'} fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity}>下一题 (Enter)</Button>
            </div>

            {status === 'incorrect' && !aiExplanation && (
              <Button variant="secondary" fullWidth onClick={handleAskAI} disabled={isExplaining} theme={settings.theme} aeroOpacity={settings.aeroOpacity} className="text-white">
                {isExplaining ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} 问 AI 为什么错了？
              </Button>
            )}

            {aiExplanation && (
              <div className={`p-5 rounded-3xl border-2 animate-in slide-in-from-bottom-2 duration-300 ${isAero ? "bg-white/40 border-white/50" : "bg-blue-50 border-blue-100"}`}>
                <div className="flex items-center gap-2 mb-2 text-blue-600 font-black">
                  <Sparkles size={16} /> AI 错因分析
                </div>
                <p className="text-sm leading-relaxed text-gray-700 font-semibold">
                  <FormattedText text={aiExplanation} />
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`flex justify-between items-center pt-4 border-t ${isAero ? "border-black/20" : "border-gray-50"}`}>
        <button onClick={onReset} className={`font-bold transition-colors flex items-center gap-2 ${isAero ? "text-black/70 hover:text-black" : "text-gray-400 hover:text-gray-600"}`}>
          <RotateCcw size={18} /> 重新输入单词
        </button>
        <button onClick={onRefresh} disabled={isLoading} className={`font-bold transition-colors flex items-center gap-2 ${isAero ? "text-black/80 hover:text-black" : "text-[#1cb0f6] hover:text-[#1899d6]"}`}>
          换一批题目
        </button>
      </div>
    </div>
  );
};

const SettingsSection: React.FC<{ settings: AppSettings, setSettings: React.Dispatch<React.SetStateAction<AppSettings>>, onClose: () => void, isDev: boolean }> = ({ settings, setSettings, onClose, isDev }) => {
  const isAero = settings.theme === 'aero';
  return (
    <div className={`p-8 space-y-6 animate-in fade-in zoom-in duration-200 transition-all ${isAero ? "text-black" : "bg-white rounded-3xl"}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-black ${isAero ? "text-black" : "text-gray-700"}`}>应用设置</h2>
        <button onClick={onClose} className={`transition-colors ${isAero ? "text-black/60 hover:text-black" : "text-gray-400 hover:text-gray-600"}`}><XCircle /></button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <div>
          <label className={`block text-sm font-bold mb-2 uppercase tracking-wide ${isAero ? "text-black/60" : "text-gray-500"}`}>界面主题风格</label>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setSettings(s => ({ ...s, theme: 'duolingo' }))}
              className={`p-3 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                settings.theme === 'duolingo' 
                  ? "bg-[#1cb0f6] text-white border-[#1899d6]" 
                  : (isAero ? "bg-white/70 border-white/30 text-black" : "bg-white border-gray-100 text-gray-400")
              }`}
            >
              <Layout size={18} /> 经典
            </button>
            <button 
              onClick={() => setSettings(s => ({ ...s, theme: 'aero' }))}
              className={`p-3 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                settings.theme === 'aero' 
                  ? "bg-blue-500/70 text-black border-white/50 backdrop-blur-md" 
                  : (isAero ? "bg-white/70 border-white/30 text-black" : "bg-white border-gray-100 text-gray-400")
              }`}
            >
              <Monitor size={18} /> Aero
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-bold mb-2 uppercase tracking-wide flex items-center gap-1 ${isAero ? "text-black/60" : "text-gray-500"}`}>
              <Hash size={16} /> 单词练习题量
            </label>
            <input 
              type="number" 
              min="3" 
              max="20" 
              className={`w-full p-3 rounded-xl border-2 focus:outline-none font-bold transition-all ${
                isAero ? "bg-white/70 border-white/30 text-black" : "bg-white border-gray-100 text-gray-800"
              }`} 
              value={settings.wordPracticeCount} 
              onChange={(e) => setSettings(s => ({ ...s, wordPracticeCount: parseInt(e.target.value) || 5 }))}
            />
          </div>
          <div>
            <label className={`block text-sm font-bold mb-2 uppercase tracking-wide flex items-center gap-1 ${isAero ? "text-black/60" : "text-gray-500"}`}>
              <Hash size={16} /> 语法练习题量
            </label>
            <input 
              type="number" 
              min="3" 
              max="20" 
              className={`w-full p-3 rounded-xl border-2 focus:outline-none font-bold transition-all ${
                isAero ? "bg-white/70 border-white/30 text-black" : "bg-white border-gray-100 text-gray-800"
              }`} 
              value={settings.grammarPracticeCount} 
              onChange={(e) => setSettings(s => ({ ...s, grammarPracticeCount: parseInt(e.target.value) || 5 }))}
            />
          </div>
        </div>

        {isAero && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <label className={`block text-sm font-bold mb-2 uppercase tracking-wide text-black/60 flex items-center gap-2`}>
                <Sliders size={16} /> Aero 按键不透明度 ({settings.aeroOpacity}%)
            </label>
            <input 
              type="range" 
              min="10" 
              max="100" 
              value={settings.aeroOpacity} 
              onChange={(e) => setSettings(s => ({ ...s, aeroOpacity: parseInt(e.target.value) }))}
              className="w-full h-2 bg-white/40 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        )}

        <div>
          <label className={`block text-sm font-bold mb-2 uppercase tracking-wide ${isAero ? "text-black/60" : "text-gray-500"}`}>模型名称</label>
          {isDev ? (
            <select className={`w-full p-3 rounded-xl border-2 focus:outline-none font-bold transition-all ${
              isAero ? "bg-white/70 border-white/30 text-black" : "bg-white border-gray-100 text-gray-800"
            }`} value={settings.modelName} onChange={(e) => setSettings(s => ({ ...s, modelName: e.target.value }))}>
              <option value="gemini-3-flash-preview" className="text-black">Gemini 3 Flash (快速)</option>
              <option value="gemini-3-pro-preview" className="text-black">Gemini 3 Pro (高质量)</option>
            </select>
          ) : (
            <input 
              type="text" 
              className={`w-full p-3 rounded-xl border-2 focus:outline-none font-bold transition-all ${
                isAero ? "bg-white/70 border-white/40 text-black placeholder-black/30" : "bg-white border-gray-100 text-gray-800"
              }`} 
              value={settings.modelName} 
              onChange={(e) => setSettings(s => ({ ...s, modelName: e.target.value }))}
              placeholder="输入模型名称..."
            />
          )}
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 uppercase tracking-wide ${isAero ? "text-black/60" : "text-gray-500"}`}>接口基准地址 (Base URL)</label>
          <input 
            type="text" 
            className={`w-full p-3 rounded-xl border-2 focus:outline-none font-bold transition-all ${
              isAero ? "bg-white/70 border-white/40 text-black placeholder-black/30" : "bg-white border-gray-100 text-gray-800"
            }`} 
            value={settings.baseUrl} 
            onChange={(e) => setSettings(s => ({ ...s, baseUrl: e.target.value }))} 
          />
        </div>

        <div className={`p-4 rounded-2xl flex gap-3 border transition-all ${
          isAero ? "bg-blue-500/20 border-white/30 text-black font-bold" : "bg-blue-50 border-blue-100 text-blue-700"
        }`}>
          <Info className="shrink-0" size={20} />
          <p className="text-xs leading-relaxed">设置将被自动保存在浏览器中。API Key 由环境注入。</p>
        </div>

        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
          isAero ? "bg-white/70 border-white/30" : "bg-gray-50 border-gray-100"
        }`}>
          <div>
            <div className="font-bold">允许单词变形</div>
            <div className={`text-xs ${isAero ? "text-black/60" : "text-gray-500"}`}>例如： 输入了good后题目中可能含有正确答案为better的题目</div>
          </div>
          <input type="checkbox" className="w-6 h-6 accent-[#58cc02]" checked={settings.allowInflection} onChange={(e) => setSettings(s => ({ ...s, allowInflection: e.target.checked }))} />
        </div>
      </div>

      <div className="pt-4">
        <Button onClick={onClose} fullWidth theme={settings.theme} aeroOpacity={settings.aeroOpacity}>确认并返回</Button>
      </div>
    </div>
  );
};

export default App;
