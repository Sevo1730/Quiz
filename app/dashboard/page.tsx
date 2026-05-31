"use client";

import { useState, useEffect, useCallback } from "react";
import { UserButton } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Sparkles,
  FileText,
  PanelLeft,
  X,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Bookmark,
} from "lucide-react";

interface QuizItem {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

interface ArticleDetail {
  id: string;
  title: string;
  content: string;
  summary: string;
  quizzes: QuizItem[];
}

interface ArticleListItem {
  id: string;
  title: string;
  quizzes: { id: string }[];
}

type ViewMode = "form" | "article" | "quiz";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [articles, setArticles] = useState<ArticleListItem[]>([]);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("form");
  const [currentArticle, setCurrentArticle] = useState<ArticleDetail | null>(null);

  // Modal
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);

  // Form
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [generating, setGenerating] = useState(false);

  // Quiz
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [pending, setPending] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  const fetchArticles = useCallback(async () => {
    const res = await fetch("/api/articles");
    if (res.ok) setArticles(await res.json());
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;
    setGenerating(true);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: formTitle, content: formContent }),
    });

    if (res.ok) {
      const { id } = await res.json();
      const detailRes = await fetch(`/api/article/${id}`);
      if (detailRes.ok) {
        const article = await detailRes.json();
        setCurrentArticle(article);
        setViewMode("article");
        setFormTitle("");
        setFormContent("");
        await fetchArticles();
        toast.success("Summary generated!");
      }
    } else {
      toast.error("Failed to generate summary");
    }
    setGenerating(false);
  }

  async function handleSelectArticle(id: string) {
    const res = await fetch(`/api/article/${id}`);
    if (res.ok) {
      const article = await res.json();
      setCurrentArticle(article);
      setViewMode("article");
      setQuizDone(false);
      setAnswers({});
    }
  }

  async function handleTakeQuiz() {
    if (!currentArticle) return;

    let quizzes = currentArticle.quizzes;
    if (quizzes.length === 0) {
      setGeneratingQuiz(true);
      const res = await fetch(`/api/article/${currentArticle.id}/quizzes`, { method: "POST" });
      if (!res.ok) {
        toast.error("Failed to generate quiz");
        setGeneratingQuiz(false);
        return;
      }
      quizzes = await res.json();
      setCurrentArticle({ ...currentArticle, quizzes });
      setGeneratingQuiz(false);
    }

    setCurrentQ(0);
    setAnswers({});
    setPending(null);
    setQuizDone(false);
    setViewMode("quiz");
  }

  function handleAnswer(quizId: string, idx: number) {
    if (pending !== null) return;
    setPending(idx);

    setTimeout(() => {
      const newAnswers = { ...answers, [quizId]: idx };
      setAnswers(newAnswers);
      setPending(null);

      const quizzes = currentArticle?.quizzes ?? [];
      if (currentQ < quizzes.length - 1) {
        setCurrentQ((q) => q + 1);
      } else {
        setQuizDone(true);
      }
    }, 450);
  }

  function exitQuiz() {
    setViewMode("article");
    setQuizDone(false);
    setAnswers({});
    setPending(null);
    setCurrentQ(0);
  }

  const quizzes = currentArticle?.quizzes ?? [];
  const currentQuiz = quizzes[currentQ];
  const score = quizzes.filter((q) => String(answers[q.id]) === q.answer).length;

  const mainPadding = !sidebarOpen ? "pl-14" : "";

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-12 border-b shrink-0">
        <span className="font-semibold text-sm">Quiz app</span>
        <UserButton />
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 border-r flex flex-col shrink-0 overflow-hidden bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-sm">History</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <PanelLeft size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {articles.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400">No articles yet.</p>
              ) : (
                articles.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleSelectArticle(a.id)}
                    className={[
                      "w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-gray-700",
                      currentArticle?.id === a.id ? "bg-gray-50 font-medium" : "",
                    ].join(" ")}
                  >
                    {a.title}
                  </button>
                ))
              )}
            </div>
          </aside>
        )}

        {/* Main */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Collapsed sidebar toggle */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute top-3 left-3 p-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-400 transition-colors z-10"
            >
              <PanelLeft size={16} />
            </button>
          )}

          {/* ── FORM VIEW ── */}
          {viewMode === "form" && (
            <div className={`flex justify-center pt-10 pb-10 px-6 ${mainPadding}`}>
              <div className="w-full max-w-2xl">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
                  <div>
                    <h2 className="text-base font-semibold flex items-center gap-2">
                      <Sparkles size={18} />
                      Article Quiz Generator
                    </h2>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                      Paste your article below to generate a summarize and quiz question. Your
                      articles will saved in the sidebar for future reference.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-1.5">
                        <FileText size={13} />
                        Article Title
                      </label>
                      <Input
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Enter a title for your article..."
                        className="border-gray-200 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-1.5">
                        <FileText size={13} />
                        Article Content
                      </label>
                      <Textarea
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        placeholder="Paste your article content here..."
                        className="min-h-36 resize-none border-gray-200 text-sm"
                        required
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={generating || !formTitle.trim() || !formContent.trim()}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {generating ? "Generating..." : "Generate summary"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ── ARTICLE VIEW ── */}
          {viewMode === "article" && currentArticle && (
            <div className={`flex justify-center pt-4 pb-10 px-6 ${mainPadding}`}>
              <div className="w-full max-w-2xl space-y-3">
                <button
                  onClick={() => setViewMode("form")}
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <Sparkles size={18} />
                    Article Quiz Generator
                  </h2>

                  {/* Summary */}
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-orange-500">
                      <FileText size={13} />
                      Summarized content
                    </p>
                    <h3 className="text-xl font-bold text-gray-900">{currentArticle.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{currentArticle.summary}</p>
                  </div>

                  {/* Content preview */}
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                      <FileText size={13} />
                      Article Content
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                      {currentArticle.content}
                    </p>
                    <button
                      onClick={() =>
                        setModalContent({
                          title: currentArticle.title,
                          content: currentArticle.content,
                        })
                      }
                      className="text-sm text-blue-600 hover:underline"
                    >
                      See more
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() =>
                        setModalContent({
                          title: currentArticle.title,
                          content: currentArticle.content,
                        })
                      }
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      See content
                    </button>
                    <button
                      onClick={handleTakeQuiz}
                      disabled={generatingQuiz}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {generatingQuiz ? "Generating quiz..." : "Take a quiz"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── QUIZ VIEW (question) ── */}
          {viewMode === "quiz" && !quizDone && currentQuiz && (
            <div className={`flex justify-center pt-10 pb-10 px-6 ${mainPadding}`}>
              <div className="w-full max-w-2xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold flex items-center gap-2">
                      <Sparkles size={18} />
                      Quick test
                    </h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Take a quick test about your knowledge from your content
                    </p>
                  </div>
                  <button
                    onClick={exitQuiz}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-medium text-gray-900 leading-snug">{currentQuiz.question}</p>
                    <span className="text-sm text-gray-400 shrink-0 mt-0.5">
                      {currentQ + 1} / {quizzes.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {currentQuiz.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(currentQuiz.id, idx)}
                        disabled={pending !== null}
                        className={[
                          "px-4 py-3 text-sm rounded-xl border text-center transition-all font-medium",
                          pending === idx
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50",
                        ].join(" ")}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── RESULTS VIEW ── */}
          {viewMode === "quiz" && quizDone && (
            <div className={`flex justify-center pt-10 pb-10 px-6 ${mainPadding}`}>
              <div className="w-full max-w-2xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold flex items-center gap-2">
                      <Sparkles size={18} />
                      Quiz completed
                    </h2>
                    <p className="text-sm text-gray-400 mt-0.5">Let&apos;s see what you did</p>
                  </div>
                  <button
                    onClick={exitQuiz}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
                  <p className="text-2xl font-bold">
                    Your score:{" "}
                    <span>
                      {score} / {quizzes.length}
                    </span>
                  </p>

                  <div className="space-y-4">
                    {quizzes.map((q, qi) => {
                      const userIdx = answers[q.id];
                      const correctIdx = Number(q.answer);
                      const isCorrect = userIdx === correctIdx;

                      return (
                        <div key={q.id} className="flex gap-3">
                          {isCorrect ? (
                            <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-gray-900">
                              {qi + 1}. {q.question}
                            </p>
                            <p className="text-sm text-gray-500">
                              Your answer:{" "}
                              {userIdx !== undefined ? q.options[userIdx] : "No answer"}
                            </p>
                            {!isCorrect && (
                              <p className="text-sm text-green-600 font-medium">
                                Correct: {q.options[correctIdx]}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 pt-1 border-t">
                    <button
                      onClick={() => {
                        setCurrentQ(0);
                        setAnswers({});
                        setPending(null);
                        setQuizDone(false);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <RotateCcw size={13} />
                      Restart quiz
                    </button>
                    <button
                      onClick={exitQuiz}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
                    >
                      <Bookmark size={13} />
                      Save and leave
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Content Modal */}
      {modalContent && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setModalContent(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-lg">{modalContent.title}</h3>
              <button
                onClick={() => setModalContent(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {modalContent.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
