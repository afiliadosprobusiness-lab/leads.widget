import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WidgetPreviewProps {
  primaryColor?: string;
  welcomeMessage?: string;
  nicheQuestion?: string;
  template?: string;
  businessName?: string;
  customPlaceholder?: string;
  customButtonText?: string;
  customConfirmationMessage?: string;
  chatPlaceholder?: string;
  mode?: 'landing' | 'dashboard';
  vibrationIntensity?: 'none' | 'soft' | 'strong';
  exitIntentEnabled?: boolean;
  exitIntentTitle?: string;
  exitIntentDescription?: string;
  exitIntentCTA?: string;
  language?: 'es' | 'en';
}

const PREVIEW_TRANSLATIONS = {
  es: {
    subtitle: 'Responde al instante con IA',
    preview_note: '⚡ Vista previa del Widget IA',
    placeholder: 'Escribe Hola...'
  },
  en: {
    subtitle: 'Replies instantly with AI',
    preview_note: '⚡ AI Widget Preview',
    placeholder: 'Type Hello...'
  }
};

export function WidgetPreview({
  primaryColor = '#00C185',
  welcomeMessage = '👋 ¡Hola! Soy la IA de LeadWidget. ¿En qué te ayudo?',
  businessName = 'LeadWidget',
  chatPlaceholder,
  mode = 'landing',
  vibrationIntensity = 'soft',
  exitIntentEnabled = true,
  exitIntentTitle = '¡Espera!',
  exitIntentDescription = 'Prueba LeadWidget gratis por 3 días y aumenta tus ventas.',
  exitIntentCTA = 'Probar Demo Ahora',
  language = 'es'
}: WidgetPreviewProps) {
  const [isOpen, setIsOpen] = useState(true); // Default open for preview
  const t = PREVIEW_TRANSLATIONS[language] || PREVIEW_TRANSLATIONS.es;
  const [messages, setMessages] = useState([
    { role: 'assistant', content: welcomeMessage }
  ]);
  const [inputText, setInputText] = useState('');
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Immediate demo on prop change
  useEffect(() => {
    if (vibrationIntensity !== 'none' && isOpen) {
      setIsIdle(true);
      const timer = setTimeout(() => setIsIdle(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [vibrationIntensity, isOpen]);

  // Idle animation logic
  useEffect(() => {
    if (!isOpen || inputText.trim() !== '' || vibrationIntensity === 'none') {
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    const startIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, 5000); // 5 seconds of inactivity
    };

    startIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isOpen, inputText, messages, vibrationIntensity]);

  // Fake interactive demo
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    // User message
    const userMsg = inputText;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputText('');

    // Fake AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '¡Genial! Esta es una demostración de cómo respondería la IA. En el widget real, aquí respondería con información de tu negocio.'
      }]);
    }, 1000);
  };

  // Dashboard Mode: Render just the chat window, relative
  if (mode === 'dashboard') {
    return (
      <div className="w-full h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden font-sans">
        {/* Header */}
        <div
          className="p-4 flex items-center justify-between text-white shadow-sm"
          style={{ background: primaryColor }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative">
              <Bot className="w-6 h-6" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 rounded-full" style={{ borderColor: primaryColor }}></div>
            </div>
            <div>
              <h3 className="font-bold text-sm">{businessName}</h3>
              <p className="text-[10px] opacity-90 text-white/90">Responde al instante con IA</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-slate-50 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user'
                  ? 'text-white rounded-br-none'
                  : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                  }`}
                style={msg.role === 'user' ? { background: primaryColor } : {}}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-slate-100">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={chatPlaceholder || t.placeholder}
              className="flex-1 bg-slate-50 border-slate-200"
            />
            <Button
              type="submit"
              size="icon"
              className="text-white shrink-0"
              style={{ background: primaryColor }}
              disabled={!inputText.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[600px] w-full flex items-end justify-end p-4 font-sans">
      {/* Widget Window */}
      <div className={`
            absolute bottom-20 right-0 w-[280px] h-[400px] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col
            transition-all duration-300 origin-bottom-right
            ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
            ${isIdle && vibrationIntensity === 'soft' ? 'animate-vibrate' : ''}
            ${isIdle && vibrationIntensity === 'strong' ? 'animate-vibrate-strong' : ''}
        `}>
        {/* Header */}
        <div
          className="p-4 flex items-center justify-between text-white shadow-sm"
          style={{ background: primaryColor }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative">
              <Bot className="w-6 h-6" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 rounded-full" style={{ borderColor: primaryColor }}></div>
            </div>
            <div>
              <h3 className="font-bold text-sm">{businessName}</h3>
              <p className="text-[10px] opacity-90 text-white/90">{t.subtitle}</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-slate-50 h-[350px] overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user'
                  ? 'text-white rounded-br-none'
                  : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                  }`}
                style={msg.role === 'user' ? { background: primaryColor } : {}}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-slate-100">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={chatPlaceholder || t.placeholder}
              className="flex-1 bg-slate-50 border-slate-200"
            />
            <Button
              type="submit"
              size="icon"
              className="text-white shrink-0"
              style={{ background: primaryColor }}
              disabled={!inputText.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px] text-slate-400">
              {t.preview_note}
            </p>
          </div>
        </div>
      </div>

      {/* Launcher Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute bottom-4 right-0 w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center z-10"
        style={{ background: primaryColor }}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Bot className="w-7 h-7 text-white" />}
      </button>
    </div>
  );
}
