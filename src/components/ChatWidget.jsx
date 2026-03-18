import { useState, useRef, useEffect, useCallback } from "react";
import { sendChatMessage } from "../api/chatApi";
import { getStatesList } from "../api/aedLawsApi";
import { fetchThreads, fetchThreadMessages, deleteThread as apiDeleteThread } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import {
  MessageSquare,
  X,
  Send,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Bot,
  User,
  Loader2,
  AlertTriangle,
  MapPin,
  Scale,
  BookOpen,
  FileText,
  ClipboardList,
  SquarePen,
  History,
  Settings2,
  LogIn,
  LogOut,
  UserPlus,
  Trash2,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────────────────

const TOPICS = ["AED", "CPR Training", "Trauma Kits"];
const INDUSTRIES = [
  "General Industry",
  "K-12 Education",
  "Government",
  "Health Club / Fitness Studio / Gym",
  "Dental Office",
  "Passenger Railways",
  "Assisted Living",
  "Youth Sports / Athletics",
];

const PROMPT_CARDS = [
  {
    icon: Scale,
    title: "Find a Statute",
    description: "Search for AED statutes by state, topic, or keyword...",
    query: "What AED-related statutes and laws are currently in effect? List the key statutes with their section numbers.",
  },
  {
    icon: BookOpen,
    title: "Ask a Law Question",
    description: "What are the AED placement requirements for schools?",
    query: "What are the AED placement requirements for schools? Which states mandate AEDs in educational facilities?",
  },
  {
    icon: FileText,
    title: "Get Definitions",
    description: 'What does "Good Samaritan protection" mean for AED users?',
    query: 'What does "Good Samaritan protection" mean in the context of AED use? Which states provide legal immunity for AED users?',
  },
  {
    icon: MapPin,
    title: "Compare States",
    description: "Which states require AEDs in fitness centers or gyms?",
    query: "Which states require AEDs in fitness centers, gyms, or health clubs? Compare the requirements across states.",
  },
];

const TASK_CARDS = [
  {
    icon: ClipboardList,
    title: "Generate a checklist",
    description: "Generate an AED compliance checklist for your state and industry.",
    query: "Generate a detailed AED compliance checklist covering placement requirements, training, maintenance, and registration obligations.",
  },
];

// ─── Markdown-lite renderer ─────────────────────────────────────────────────

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const Tag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
      elements.push(<Tag key={i} className="font-semibold mt-3 mb-1 text-gray-900">{renderInline(headingMatch[2])}</Tag>);
      i++; continue;
    }

    if (/^[\-\*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[\-\*]\s+/.test(lines[i])) {
        items.push(<li key={i} className="ml-4 mb-1">{renderInline(lines[i].replace(/^[\-\*]\s+/, ""))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="list-disc pl-4 my-2">{items}</ul>);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(<li key={i} className="ml-4 mb-1">{renderInline(lines[i].replace(/^\d+\.\s+/, ""))}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="list-decimal pl-4 my-2">{items}</ol>);
      continue;
    }

    elements.push(<p key={i} className="mb-2">{renderInline(line)}</p>);
    i++;
  }
  return elements;
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ─── Sidebar Filter Section ─────────────────────────────────────────────────

function FilterSection({ label, value, children, onClear }) {
  const [open, setOpen] = useState(false);
  const hasValue = !!value;

  return (
    <div
      className="border rounded-lg transition-colors cursor-pointer"
      style={{ borderColor: hasValue ? "#111686" : "#e2e6ef", backgroundColor: hasValue ? "#f0f2fd" : "#fff" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
      >
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: "#6b7280" }}>{label}</p>
          {hasValue && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-sm font-semibold truncate" style={{ color: "#111686" }}>{value}</p>
              <button
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs hover:bg-gray-200"
                style={{ color: "#111686" }}
              >
                ×
              </button>
            </div>
          )}
          {!hasValue && <p className="text-sm text-gray-400 mt-0.5">Any</p>}
        </div>
        {open ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-3 pb-3 border-t" style={{ borderColor: "#e2e6ef" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Auth Modal ─────────────────────────────────────────────────────────────

function AuthModal({ mode: initialMode, onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "register") {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "login" ? "Sign in" : "Create account"}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "#d6dcea", "--tw-ring-color": "#111686" }}
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "#d6dcea", "--tw-ring-color": "#111686" }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "#d6dcea", "--tw-ring-color": "#111686" }}
              placeholder={mode === "register" ? "Min. 6 characters" : "Your password"}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-colors disabled:opacity-60"
            style={{ backgroundColor: "#111686" }}
          >
            {submitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </button>

          <p className="text-center text-sm text-gray-500">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="font-semibold hover:underline"
              style={{ color: "#111686" }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ChatWidget() {
  const { user, sessionId, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ state: "", topic: "", industry: "" });
  const [states, setStates] = useState([]);
  const [statesLoaded, setStatesLoaded] = useState(false);
  const [threads, setThreads] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authModal, setAuthModal] = useState(null); // null | "login" | "register"

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load states for filter dropdown
  useEffect(() => {
    if (isOpen && !statesLoaded) {
      getStatesList().then((data) => { setStates(data); setStatesLoaded(true); }).catch(() => {});
    }
  }, [isOpen, statesLoaded]);

  // Load threads when copilot opens or user changes
  useEffect(() => {
    if (isOpen) {
      loadThreads();
    }
  }, [isOpen, user]);

  const loadThreads = async () => {
    try {
      const data = await fetchThreads(sessionId);
      setThreads(data);
    } catch {
      setThreads([]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startNewThread = () => {
    setMessages([]);
    setActiveThreadId(null);
    setInput("");
  };

  const loadThread = async (thread) => {
    try {
      const msgs = await fetchThreadMessages(thread.id, sessionId);
      setMessages(msgs.map((m) => ({
        role: m.role,
        content: m.content,
        sources: m.sources || [],
        usedWebFallback: m.used_web_fallback || false,
      })));
      setActiveThreadId(thread.id);
      setShowHistory(false);
    } catch {
      // fallback
    }
  };

  const handleDeleteThread = async (e, threadId) => {
    e.stopPropagation();
    await apiDeleteThread(threadId);
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    if (activeThreadId === threadId) {
      setMessages([]);
      setActiveThreadId(null);
    }
  };

  const sendMessage = useCallback(
    async (text) => {
      const userMessage = (text || input).trim();
      if (!userMessage || loading) return;
      setInput("");

      const newUserMsg = { role: "user", content: userMessage };
      setMessages((prev) => [...prev, newUserMsg]);
      setLoading(true);

      try {
        const filterPayload = {};
        if (filters.state) filterPayload.state = filters.state;
        if (filters.topic) filterPayload.topic = filters.topic;
        if (filters.industry) filterPayload.industry = filters.industry;

        const data = await sendChatMessage(userMessage, filterPayload, activeThreadId, sessionId);

        // If this was the first message (new thread), save the threadId
        if (!activeThreadId && data.threadId) {
          setActiveThreadId(data.threadId);
          // Refresh threads list
          loadThreads();
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
            sources: data.sources || [],
            usedWebFallback: data.usedWebFallback || false,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I'm sorry, I encountered an error processing your request. Please try again.",
            isError: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, filters, activeThreadId, sessionId]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const stateName = states.find((s) => s.slug === filters.state)?.name || "";
  const hasConversation = messages.length > 0;

  return (
    <>
      {/* ── Auth Modal ── */}
      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />}

      {/* ── Floating Trigger Bar ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-full shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.03]"
          style={{ backgroundColor: "#111686", color: "#fff" }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <Bot size={18} />
          </div>
          <span className="text-sm font-semibold">Ask Copilot</span>
        </button>
      )}

      {/* ── Full Copilot Overlay ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="flex flex-1 overflow-hidden m-3 md:m-5 lg:m-8 rounded-2xl shadow-2xl" style={{ backgroundColor: "#fff" }}>

            {/* ── Left Sidebar ── */}
            {sidebarOpen && (
              <div className="w-64 flex-shrink-0 flex flex-col border-r overflow-y-auto" style={{ borderColor: "#e2e6ef", backgroundColor: "#fafbfe" }}>
                {/* Sidebar Header */}
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Copilot</h2>
                  <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 md:hidden">
                    <X size={18} />
                  </button>
                </div>

                {/* New Thread */}
                <div className="px-3 pb-3">
                  <button
                    onClick={startNewThread}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-gray-600 hover:bg-white hover:border-gray-300 transition-colors"
                    style={{ borderColor: "#e2e6ef" }}
                  >
                    <SquarePen size={14} />
                    New thread
                  </button>
                </div>

                {/* Settings / Filters */}
                <div className="px-3 pb-2">
                  <div className="flex items-center gap-2 px-1 pb-2">
                    <Settings2 size={14} className="text-gray-500" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings</span>
                  </div>

                  <div className="space-y-2">
                    <FilterSection label="Jurisdiction" value={stateName} onClear={() => setFilters((f) => ({ ...f, state: "" }))}>
                      <div className="pt-2 max-h-48 overflow-y-auto">
                        {states.map((s) => (
                          <button key={s.slug} onClick={() => setFilters((f) => ({ ...f, state: s.slug }))}
                            className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${filters.state === s.slug ? "font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                            style={filters.state === s.slug ? { color: "#111686", backgroundColor: "#eef0fa" } : {}}>
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </FilterSection>

                    <FilterSection label="Topic" value={filters.topic} onClear={() => setFilters((f) => ({ ...f, topic: "" }))}>
                      <div className="pt-2 space-y-0.5">
                        {TOPICS.map((t) => (
                          <button key={t} onClick={() => setFilters((f) => ({ ...f, topic: t }))}
                            className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${filters.topic === t ? "font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                            style={filters.topic === t ? { color: "#111686", backgroundColor: "#eef0fa" } : {}}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </FilterSection>

                    <FilterSection label="Industry" value={filters.industry} onClear={() => setFilters((f) => ({ ...f, industry: "" }))}>
                      <div className="pt-2 space-y-0.5 max-h-48 overflow-y-auto">
                        {INDUSTRIES.map((ind) => (
                          <button key={ind} onClick={() => setFilters((f) => ({ ...f, industry: ind }))}
                            className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${filters.industry === ind ? "font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                            style={filters.industry === ind ? { color: "#111686", backgroundColor: "#eef0fa" } : {}}>
                            {ind}
                          </button>
                        ))}
                      </div>
                    </FilterSection>
                  </div>
                </div>

                {/* History */}
                <div className="px-3 pt-3 pb-2 border-t flex-1 min-h-0" style={{ borderColor: "#e2e6ef" }}>
                  <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 px-1 pb-2 w-full text-left">
                    <History size={14} className="text-gray-500" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">History</span>
                    {showHistory ? <ChevronDown size={12} className="text-gray-400 ml-auto" /> : <ChevronRight size={12} className="text-gray-400 ml-auto" />}
                  </button>
                  {showHistory && (
                    <div className="space-y-0.5 max-h-48 overflow-y-auto">
                      {threads.length === 0 ? (
                        <p className="text-xs text-gray-400 px-1 italic">
                          {user ? "No conversations yet." : "Sign in to save your conversations."}
                        </p>
                      ) : (
                        threads.map((thread) => (
                          <div key={thread.id}
                            className={`flex items-center gap-1 group rounded px-2 py-1.5 cursor-pointer transition-colors ${activeThreadId === thread.id ? "bg-white" : "hover:bg-white"}`}
                            onClick={() => loadThread(thread)}>
                            <span className={`text-sm truncate flex-1 ${activeThreadId === thread.id ? "font-medium text-gray-900" : "text-gray-600"}`}>
                              {thread.title}
                            </span>
                            <button
                              onClick={(e) => handleDeleteThread(e, thread.id)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {!showHistory && threads.length === 0 && (
                    <p className="text-xs text-gray-400 px-1 italic">
                      {user ? "Start a conversation." : "Sign in to keep your chats."}
                    </p>
                  )}
                </div>

                {/* User / Auth Section */}
                <div className="px-3 py-3 border-t flex-shrink-0" style={{ borderColor: "#e2e6ef" }}>
                  {user ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#111686" }}>
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <button onClick={logout} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Sign out">
                        <LogOut size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        onClick={() => setAuthModal("login")}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                        style={{ backgroundColor: "#111686" }}
                      >
                        <LogIn size={14} />
                        Sign in
                      </button>
                      <button
                        onClick={() => setAuthModal("register")}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-gray-600 hover:bg-white transition-colors"
                        style={{ borderColor: "#e2e6ef" }}
                      >
                        <UserPlus size={14} color="#111686" />
                        Create account
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Main Content Area ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: "#e2e6ef" }}>
                <div className="flex items-center gap-2">
                  {!sidebarOpen && (
                    <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg bg-[#111686] text-gray-500 mr-1">
                      <MessageSquare size={18} />
                    </button>
                  )}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "#111686" }}>
                    <Bot size={15} color="#fff" />
                  </div>
                  <span className="font-semibold text-sm text-gray-800">AED Law Copilot</span>
                </div>
                <div className="flex items-center gap-1">
                  {sidebarOpen && (
                    <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg bg-[#111686] text-gray-400 hidden md:flex">
                      <MessageSquare size={16} />
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg bg-red-500 text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                {!hasConversation ? (
                  /* ── Welcome Screen ── */
                  <div className="max-w-2xl mx-auto px-6 py-10">
                    <div className="text-center mb-8">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#eef0fa" }}>
                        <Bot size={24} color="#111686" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">What can Copilot help with?</h1>
                      <p className="text-gray-500">
                        I can help answer AED law questions
                        {stateName ? <> in <strong>{stateName}</strong></> : " across all U.S. states"}
                        {filters.topic ? <> about <strong>{filters.topic}</strong></> : ""}.
                      </p>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-gray-500 mb-3">Prompts</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {PROMPT_CARDS.map((card, i) => {
                          const Icon = card.icon;
                          return (
                            <button key={i} onClick={() => sendMessage(card.query)}
                              className="text-left p-4 rounded-xl border hover:shadow-md hover:border-gray-300 transition-all bg-white"
                              style={{ borderColor: "#e2e6ef" }}>
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "#111686" }}>
                                <Icon size={18} color="#fff" />
                              </div>
                              <h4 className="font-semibold text-sm text-gray-900 mb-1">{card.title}</h4>
                              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{card.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-gray-500 mb-3">Tasks</h3>
                      <div className="space-y-2">
                        {TASK_CARDS.map((card, i) => {
                          const Icon = card.icon;
                          return (
                            <button key={i} onClick={() => sendMessage(card.query)}
                              className="w-full flex items-center gap-4 p-4 rounded-xl border hover:shadow-md hover:border-gray-300 transition-all bg-white text-left"
                              style={{ borderColor: "#e2e6ef" }}>
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#111686" }}>
                                <Icon size={18} color="#fff" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-sm text-gray-900">{card.title}</h4>
                                <p className="text-xs text-gray-500 truncate">{card.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl p-5 flex items-center justify-between overflow-hidden relative"
                      style={{ background: "linear-gradient(135deg, #111686 0%, #1e2a9a 50%, #2d3cb0 100%)" }}>
                      <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)"
                      }} />
                      <div className="relative z-10">
                        <h3 className="text-white font-bold text-base mb-1">Navigate AED compliance with Copilot</h3>
                        <p className="text-white/70 text-sm">
                          {user ? "Your conversations are saved to your account." : "Sign in to save your conversations permanently."}
                        </p>
                      </div>
                      {!user && (
                        <button onClick={() => setAuthModal("register")}
                          className="relative z-10 flex-shrink-0 ml-4 px-4 py-2 rounded-lg bg-white text-sm font-semibold transition-colors hover:bg-gray-50"
                          style={{ color: "#111686" }}>
                          Sign up free
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ── Conversation View ── */
                  <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: msg.role === "user" ? "#d6dcea" : "#111686" }}>
                          {msg.role === "user" ? <User size={15} color="#111686" /> : <Bot size={15} color="#fff" />}
                        </div>

                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user" ? "text-white"
                            : msg.isError ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-white text-gray-800 shadow-sm border border-gray-100"
                        }`} style={msg.role === "user" ? { backgroundColor: "#111686" } : undefined}>
                          {msg.role === "assistant" ? <div>{renderMarkdown(msg.content)}</div> : <p>{msg.content}</p>}

                          {msg.usedWebFallback && (
                            <div className="flex items-start gap-1.5 mt-3 pt-2.5 border-t border-gray-100">
                              <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-600">This response is based on general knowledge, not our database.</p>
                            </div>
                          )}

                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-500 mb-1.5">Sources</p>
                              <div className="space-y-1">
                                {msg.sources.map((src, j) => (
                                  <div key={j} className="text-xs text-gray-600">
                                    {src.url ? (
                                      <a href={src.url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 hover:underline" style={{ color: "#111686" }}>
                                        <ExternalLink size={10} />
                                        {src.state}: {src.title}{src.section ? ` (§${src.section})` : ""}
                                      </a>
                                    ) : (
                                      <span>{src.state}: {src.title}{src.section ? ` (§${src.section})` : ""}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#111686" }}>
                          <Bot size={15} color="#fff" />
                        </div>
                        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Searching laws...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* ── Input Bar ── */}
              <div className="flex-shrink-0 px-6 py-4 border-t" style={{ borderColor: "#e2e6ef" }}>
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-end gap-2 rounded-xl border bg-white px-4 py-3 focus-within:ring-2 focus-within:border-transparent transition-all"
                    style={{ borderColor: "#d6dcea", "--tw-ring-color": "#111686" }}>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter your question"
                      rows={1}
                      className="flex-1 resize-none text-sm focus:outline-none bg-transparent text-gray-800 placeholder-gray-400"
                      style={{ maxHeight: "100px", minHeight: "24px" }}
                      onInput={(e) => { e.target.style.height = "24px"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
                      disabled={loading}
                    />
                    <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                      className="p-2 rounded-lg transition-all flex-shrink-0 disabled:opacity-30"
                      style={{ color: loading || !input.trim() ? "#9ca3af" : "#111686" }}>
                      <Send size={18} />
                    </button>
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-2">
                    AI-powered responses — always verify with official legal sources.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
