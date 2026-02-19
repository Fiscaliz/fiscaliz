import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Scale, 
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Sugestões agrupadas por contexto
const SUGGESTION_GROUPS = [
  {
    label: 'Documentos & Prazos',
    icon: '📋',
    questions: [
      'Qual o prazo máximo para um Termo de Intimação?',
      'Quando posso lavrar um Auto de Infração?',
      'Quais documentos o fiscal pode emitir?',
    ],
  },
  {
    label: 'RDC 216/2004',
    icon: '🍽️',
    questions: [
      'Quais os requisitos da RDC 216/2004 para lavatórios?',
      'Qual a temperatura mínima para alimentos quentes?',
      'Como deve ser feito o controle de pragas conforme RDC 216?',
    ],
  },
  {
    label: 'Penalidades',
    icon: '⚖️',
    questions: [
      'Quando posso interditar um estabelecimento?',
      'Qual a base legal para apreensão de alimentos vencidos?',
      'Como funciona a multa por UVF no código sanitário de Goiânia?',
    ],
  },
];

// Perguntas de acompanhamento geradas com base no contexto
function getFollowUpSuggestions(messages: Message[]): string[] {
  if (messages.length === 0) return [];

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant')?.content?.toLowerCase() || '';
  const combined = lastUserMsg + ' ' + lastAssistantMsg;

  const suggestions: string[] = [];

  if (combined.includes('rdc 216') || combined.includes('alimento') || combined.includes('restaurante') || combined.includes('manipulador')) {
    suggestions.push('Qual o procedimento correto para inutilizar alimentos impróprios?');
    suggestions.push('Quais os requisitos de temperatura para armazenamento de perecíveis?');
  }
  if (combined.includes('auto de infração') || combined.includes('infracao') || combined.includes('multa') || combined.includes('penalidade')) {
    suggestions.push('Como calcular o valor da multa em UVF?');
    suggestions.push('Qual o prazo para defesa no Auto de Infração?');
  }
  if (combined.includes('interdição') || combined.includes('interdicao') || combined.includes('interditar')) {
    suggestions.push('Quais são os requisitos para levantar uma interdição?');
    suggestions.push('Interdição parcial x total: quais as diferenças legais?');
  }
  if (combined.includes('prazo') || combined.includes('intimação') || combined.includes('intimacao')) {
    suggestions.push('O que acontece se o prazo da intimação for descumprido?');
    suggestions.push('Posso prorrogar o prazo de uma intimação?');
  }
  if (combined.includes('farmácia') || combined.includes('farmacia') || combined.includes('medicamento') || combined.includes('rdc 44')) {
    suggestions.push('Quais documentos são exigidos em farmácias e drogarias?');
    suggestions.push('Qual a base legal para fiscalizar substâncias controladas?');
  }
  if (combined.includes('dengue') || combined.includes('arbovirose') || combined.includes('vetor')) {
    suggestions.push('Qual a legislação municipal sobre controle de dengue em estabelecimentos?');
    suggestions.push('Quais medidas posso exigir para combate à dengue?');
  }
  if (combined.includes('água') || combined.includes('caixa d\'agua') || combined.includes('caixa dagua') || combined.includes('reservatório')) {
    suggestions.push('Com que frequência o reservatório de água deve ser higienizado?');
    suggestions.push('O que exige a Portaria 888/2021 sobre qualidade da água?');
  }

  // Generic follow-up if nothing specific matched
  if (suggestions.length === 0 && messages.length > 0) {
    suggestions.push('Qual documento fiscal devo lavrar nessa situação?');
    suggestions.push('Cite o artigo específico que fundamenta essa exigência.');
    suggestions.push('Quais são as penalidades previstas para essa infração?');
  }

  return suggestions.slice(0, 3);
}

export default function ConsultAI() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setShowSuggestions(false);

    let assistantSoFar = '';

    try {
      const allMessages = [...messages, userMsg];

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/consult-legislation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error('Sem resposta do servidor');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      const upsertAssistant = (nextChunk: string) => {
        assistantSoFar += nextChunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (error: any) {
      console.error('AI consultation error:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao consultar a IA',
        variant: 'destructive',
      });
      if (!assistantSoFar) {
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
    setShowSuggestions(true);
    setExpandedGroup(0);
  };

  const followUpSuggestions = getFollowUpSuggestions(messages);

  return (
    <AppLayout>
      <Header title="Consulte a IA" subtitle="Legislação Sanitária" showBack />

      <div className="flex flex-col h-[calc(100vh-180px)]">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 ? (
            /* ── Empty state: sugestões agrupadas ── */
            <div className="flex flex-col items-center justify-start h-full space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-primary/10">
                <Scale className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold">Assistente Jurídico</h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Especializado em legislação sanitária de Goiânia. Pergunte sobre normas, prazos, penalidades e procedimentos.
                </p>
              </div>

              <div className="w-full space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
                  Escolha um tema ou escreva sua pergunta
                </p>
                {SUGGESTION_GROUPS.map((group, gi) => (
                  <Card key={gi} className="border-0 shadow-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedGroup(expandedGroup === gi ? null : gi)}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{group.icon}</span>
                        <span className="text-sm font-medium">{group.label}</span>
                      </div>
                      {expandedGroup === gi ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedGroup === gi && (
                      <div className="border-t">
                        {group.questions.map((q, qi) => (
                          <button
                            key={qi}
                            onClick={() => sendMessage(q)}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-muted/50 transition-colors border-b last:border-b-0 flex items-start gap-2"
                          >
                            <span className="text-primary mt-0.5">→</span>
                            <span>{q}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* ── Messages ── */
            <>
              {messages.map((msg, i) => (
                <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  )}
                  <Card className={cn('max-w-[85%] border-0 shadow-sm', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50')}>
                    <CardContent className="p-3">
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                        {isLoading && i === messages.length - 1 && msg.role === 'assistant' && (
                          <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-middle" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-7 w-7 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-secondary" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-2 justify-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <Card className="border-0 shadow-sm bg-muted/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Consultando legislação…
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Follow-up suggestions after AI replies */}
              {!isLoading && followUpSuggestions.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-1 px-1">
                    <Lightbulb className="h-3 w-3 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Perguntas relacionadas</p>
                  </div>
                  {followUpSuggestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left p-2 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors text-xs"
                    >
                      <span className="text-primary mr-1">→</span>{q}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="border-t bg-card/80 backdrop-blur-sm p-3 space-y-2">
          {messages.length > 0 && (
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <BookOpen className="h-3 w-3" />
                {showSuggestions ? 'Ocultar sugestões' : 'Ver sugestões'}
              </button>
              <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs text-muted-foreground h-7">
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            </div>
          )}

          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre legislação sanitária…"
              className="min-h-[44px] max-h-[120px] resize-none text-sm rounded-xl"
              rows={1}
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="h-11 w-11 rounded-xl flex-shrink-0"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            <Sparkles className="h-3 w-3 inline mr-1" />
            Baseado no compêndio de legislação sanitária municipal, estadual e federal
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
