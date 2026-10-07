import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Send, Bot, User, X, AlertCircle } from 'lucide-react';

interface BusinessAssistantModalProps {
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  metrics?: { label: string; value: string }[];
}

export const BusinessAssistantModal: React.FC<BusinessAssistantModalProps> = ({ onClose }) => {
  const {
    business,
    currentUser,
    sales,
    expenses,
    debts,
    products,
    language,
    isOffline,
  } = useApp();

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-seed greeting
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_0',
      sender: 'assistant',
      text:
        language === 'am'
          ? `እንደምን አደሩ ${currentUser.name.split(' ')[0]}! እኔ የ${business.amharicName || business.name} ብልህ የንግድ ረዳት ነኝ። ዛሬ ስለ ሽያጭዎ፣ ስለ ደንበኞች ዕዳ፣ ስለ ትርፍ ወይም ሊያልቁ ስለተቃረቡ እቃዎች ማንኛውንም ጥያቄ ይጠይቁኝ።`
          : `Hello ${currentUser.name.split(' ')[0]}! I am your AI Business Assistant for ${business.name}. Ask me any questions about your sales, debts, profits, or low stock levels.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Fast Deterministic Local Business Intelligence Analyzer
  const analyzeLocally = (query: string): { text: string; metrics?: { label: string; value: string }[] } => {
    const q = query.toLowerCase();
    const todayStr = new Date().toISOString().split('T')[0];

    const todaySales = sales.filter((s) => s.createdAt.startsWith(todayStr));
    const todaySalesTotal = todaySales.reduce((acc, s) => acc + s.total, 0);
    const todayCash = todaySales.reduce((acc, s) => acc + s.amountPaid, 0);
    const todayCOGS = todaySales.reduce((acc, s) => acc + (s.costOfGoodsSold || 0), 0);
    const todayGross = todaySalesTotal - todayCOGS;
    const todayExp = expenses
      .filter((e) => e.createdAt.startsWith(todayStr))
      .reduce((acc, e) => acc + e.amount, 0);
    const todayNet = todayGross - todayExp;

    const totalOutstandingDebt = debts.reduce((acc, d) => acc + d.remainingDebt, 0);
    const overdueDebts = debts.filter((d) => d.status === 'OVERDUE' && d.remainingDebt > 0);
    const lowStock = products.filter((p) => p.quantity <= p.minStock);

    // 1. Debt Question ("ማን ዕዳ አለበት?", "who owes money", "ዕዳ")
    if (q.includes('ዕዳ') || q.includes('ማን') || q.includes('owe') || q.includes('debt')) {
      const activeDebtors = debts.filter((d) => d.remainingDebt > 0);
      const debtorList = activeDebtors
        .map((d) => `• ${d.customerName} (${d.customerPhone}): ${d.remainingDebt.toLocaleString()} ETB ${d.status === 'OVERDUE' ? '⚠️ (ቀን አልፏል)' : ''}`)
        .join('\n');

      return {
        text:
          language === 'am'
            ? `በአሁኑ ሰዓት በሱቅዎ ውስጥ ያልተሰበሰበ ጠቅላላ ዕዳ ${totalOutstandingDebt.toLocaleString()} ብር ነው። በአጠቃላይ ${activeDebtors.length} ደንበኞች ዕዳ አለባቸው:\n\n${debtorList}\n\n💡 ምክር: በተለይ ቀኑ ላለፈባቸው ደንበኞች በስርዓቱ አማካኝነት የSMS ወይም የTelegram ማስታወሻ ይላኩላቸው።`
            : `Your total outstanding customer debt is ${totalOutstandingDebt.toLocaleString()} ETB across ${activeDebtors.length} customers:\n\n${debtorList}\n\n💡 Recommendation: Send reminders to overdue customers via the Debt Hub immediately.`,
        metrics: [
          { label: 'ጠቅላላ ዕዳ', value: `${totalOutstandingDebt.toLocaleString()} ETB` },
          { label: 'ቀን ያለፈበት', value: `${overdueDebts.length} ደንበኞች` },
        ],
      };
    }

    // 2. Sales Question ("ስንት ሸጥኩ?", "how much did i sell", "ሽያጭ")
    if (q.includes('ሸጥኩ') || q.includes('ሽያጭ') || q.includes('sell') || q.includes('sales')) {
      return {
        text:
          language === 'am'
            ? `የዛሬ የሱቅዎ ጠቅላላ ሽያጭ ${todaySalesTotal.toLocaleString()} ብር ነው። ከዚህ ውስጥ በጥሬ ገንዘብ ${todayCash.toLocaleString()} ብር የተሰበሰበ ሲሆን፣ የቀረው በብድር የተሸጠ ነው።\n\nዛሬ ${todaySales.length} የሽያጭ ግብይቶች ተከናውነዋል።`
            : `Today's gross sales total is ${todaySalesTotal.toLocaleString()} ETB across ${todaySales.length} transactions (${todayCash.toLocaleString()} ETB received in cash).`,
        metrics: [
          { label: 'የዛሬ ሽያጭ', value: `${todaySalesTotal.toLocaleString()} ETB` },
          { label: 'ጥሬ ገንዘብ', value: `${todayCash.toLocaleString()} ETB` },
        ],
      };
    }

    // 3. Profit Question ("ትርፍ", "profit")
    if (q.includes('ትርፍ') || q.includes('profit')) {
      return {
        text:
          language === 'am'
            ? `የዛሬ የሱቅዎ ትርፍ ትንተና:\n• የተሸጡ እቃዎች መግዣ ዋጋ (COGS): ${todayCOGS.toLocaleString()} ብር\n• አጠቃላይ ትርፍ (Gross Profit): ${todayGross.toLocaleString()} ብር\n• የተመዘገቡ ወጪዎች: ${todayExp.toLocaleString()} ብር\n• የተጣራ ትርፍ (Estimated Net Profit): ${todayNet.toLocaleString()} ብር`
            : `Today's Profit Analysis:\n• COGS: ${todayCOGS.toLocaleString()} ETB\n• Gross Profit: ${todayGross.toLocaleString()} ETB\n• Operating Expenses: ${todayExp.toLocaleString()} ETB\n• Net Profit: ${todayNet.toLocaleString()} ETB`,
        metrics: [
          { label: 'Gross Profit', value: `${todayGross.toLocaleString()} ETB` },
          { label: 'Net Profit', value: `${todayNet.toLocaleString()} ETB` },
        ],
      };
    }

    // 4. Low Stock Question ("ምን እቃ ሊያልቅ ነው?", "ምን እቃ ልግዛ?", "stock", "እቃ")
    if (q.includes('እቃ') || q.includes('ልግዛ') || q.includes('ሊያልቅ') || q.includes('stock') || q.includes('buy')) {
      const items = lowStock
        .map((p) => `• ${p.amharicName || p.name}: ${p.quantity} ${p.unit} ቀርቷል (ዝቅተኛ: ${p.minStock})`)
        .join('\n');

      return {
        text:
          language === 'am'
            ? `በአሁኑ ሰዓት ${lowStock.length} እቃዎች ከዝቅተኛው የማስጠንቀቂያ ጣሪያ በታች ናቸው እና በአስቸኳይ መታዘዝ አለባቸው:\n\n${items || 'ሁሉም እቃዎች በቂ ክምችት አላቸው።'}`
            : `You have ${lowStock.length} items running low on stock:\n\n${items || 'All items have healthy inventory.'}`,
        metrics: [
          { label: 'ሊያልቁ የደረሱ', value: `${lowStock.length} እቃዎች` },
        ],
      };
    }

    // Default intelligent summary
    return {
      text:
        language === 'am'
          ? `የሱቅዎ ወቅታዊ ሁኔታ:\n• የዛሬ ሽያጭ: ${todaySalesTotal.toLocaleString()} ብር\n• የዛሬ የተጣራ ትርፍ: ${todayNet.toLocaleString()} ብር\n• ያልተሰበሰበ የደንበኞች ዕዳ: ${totalOutstandingDebt.toLocaleString()} ብር\n• ሊያልቁ የተቃረቡ እቃዎች: ${lowStock.length} እቃዎች\n\nለበለጠ ማብራሪያ አንዱን መርጠው ይጠይቁኝ!`
          : `Current Store Overview:\n• Today's Sales: ${todaySalesTotal.toLocaleString()} ETB\n• Net Profit: ${todayNet.toLocaleString()} ETB\n• Outstanding Debt: ${totalOutstandingDebt.toLocaleString()} ETB\n• Low Stock: ${lowStock.length} items.`,
    };
  };

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      // If offline, use high precision local analyzer
      if (isOffline) {
        const localAns = analyzeLocally(q);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_ai_${Date.now()}`,
            sender: 'assistant',
            text: localAns.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            metrics: localAns.metrics,
          },
        ]);
        setLoading(false);
        return;
      }

      // Try Server API proxy with Gemini
      const businessSummary = {
        name: business.name,
        todaySales: sales.filter((s) => s.createdAt.startsWith(new Date().toISOString().split('T')[0])),
        debts: debts.map((d) => ({
          customer: d.customerName,
          phone: d.customerPhone,
          remaining: d.remainingDebt,
          status: d.status,
          dueDate: d.dueDate,
        })),
        lowStockProducts: products
          .filter((p) => p.quantity <= p.minStock)
          .map((p) => ({ name: p.name, amharic: p.amharicName, qty: p.quantity, min: p.minStock })),
        expenses: expenses.map((e) => ({ amount: e.amount, category: e.category })),
      };

      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          businessSummary,
          language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.source === 'gemini' && data.answer) {
          setMessages((prev) => [
            ...prev,
            {
              id: `msg_ai_${Date.now()}`,
              sender: 'assistant',
              text: data.answer,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setLoading(false);
          return;
        }
      }

      // Fallback to deterministic local engine
      const fallbackAns = analyzeLocally(q);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_ai_${Date.now()}`,
          sender: 'assistant',
          text: fallbackAns.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metrics: fallbackAns.metrics,
        },
      ]);
    } catch {
      const fallbackAns = analyzeLocally(q);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_ai_${Date.now()}`,
          sender: 'assistant',
          text: fallbackAns.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metrics: fallbackAns.metrics,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: '💳 ማን ዕዳ አለበት?', query: 'ማን ዕዳ አለበት?' },
    { label: '💰 ዛሬ ስንት ሸጥኩ?', query: 'ዛሬ ስንት ሸጥኩ?' },
    { label: '📈 ስንት አተረፍኩ?', query: 'ስንት አተረፍኩ?' },
    { label: '📦 ምን እቃ ሊያልቅ ነው?', query: 'ምን እቃ ሊያልቅ ነው?' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[650px] max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                <span>ETHIO AI BUSINESS ASSISTANT</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-bold">
                  🇪🇹
                </span>
              </h3>
              <p className="text-[11px] text-blue-200">
                {language === 'am'
                  ? 'በሱቅዎ ትክክለኛ መረጃዎች ላይ የተመሰረተ የንግድ ረዳት'
                  : 'Authorized Business Intelligence for your store'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick prompt suggestions */}
        <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex gap-1.5 overflow-x-auto text-xs no-scrollbar">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.query)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 text-slate-700 whitespace-nowrap font-medium text-xs shadow-2xs hover:bg-blue-50 transition"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm space-y-2 shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none leading-relaxed'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {msg.metrics && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    {msg.metrics.map((m, i) => (
                      <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">{m.label}</span>
                        <strong className="text-xs text-slate-900 font-mono">{m.value}</strong>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[10px] ${
                    msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 items-center text-xs text-slate-500 pl-2">
              <Bot className="w-4 h-4 text-blue-600 animate-spin" />
              <span>{language === 'am' ? 'የንግድ ረዳቱ መረጃዎችን እየመረመረ ነው...' : 'Analyzing store data...'}</span>
            </div>
          )}
        </div>

        {/* Disclaimer Note */}
        <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
          <span>
            {language === 'am'
              ? 'ማሳሰቢያ: ትንታኔው በሱቅዎ በተመዘገቡ መረጃዎች ላይ የተመሰረተ አጋዥ መረጃ እንጂ የባንክ ወይም የታክስ ዋስትና አይደለም።'
              : 'Notice: AI analysis is generated from your store records for decision support, not financial or legal advice.'}
          </span>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                language === 'am'
                  ? 'ስለ ሽያጭ፣ ትርፍ፣ ዕዳ ወይም እቃ ይጠይቁ...'
                  : 'Ask about sales, debts, profits, or low stock...'
              }
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'am' ? 'ጠይቅ' : 'Send'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
