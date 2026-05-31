"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Quiz {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

interface Article {
  id: string;
  title: string;
  quizzes: Quiz[];
}

type AnswerMap = Record<string, number>;

export default function QuizPage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = use(params);
  const [article, setArticle] = useState<Article | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/article/${articleId}`)
      .then((r) => r.json())
      .then((data) => {
        setArticle(data);
        setLoading(false);
      });
  }, [articleId]);

  function handleAnswer(quizId: string, idx: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [quizId]: idx }));
  }

  function handleSubmit() {
    if (!article) return;
    if (Object.keys(answers).length < article.quizzes.length) return;
    setSubmitted(true);
  }

  function handleRetake() {
    setAnswers({});
    setSubmitted(false);
  }

  if (loading || !article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading quiz...</p>
      </div>
    );
  }

  const quizzes = article.quizzes;

  const score = submitted
    ? quizzes.filter((q) => String(answers[q.id]) === q.answer).length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center gap-4">
        <Link
          href={`/article/${articleId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Article
        </Link>
        <span className="font-medium">{article.title}</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {submitted && (
          <Card className="border-primary/40">
            <CardContent className="py-6 text-center space-y-2">
              <p className="text-2xl font-bold">
                {score} / {quizzes.length}
              </p>
              <p className="text-muted-foreground">
                {score === quizzes.length
                  ? "Perfect score!"
                  : score >= quizzes.length / 2
                  ? "Good job!"
                  : "Keep practicing!"}
              </p>
              <Button variant="outline" size="sm" onClick={handleRetake}>
                Retake Quiz
              </Button>
            </CardContent>
          </Card>
        )}

        {quizzes.map((quiz, qi) => {
          const selected = answers[quiz.id];
          const correct = Number(quiz.answer);
          const isCorrect = submitted && selected === correct;
          const isWrong = submitted && selected !== undefined && selected !== correct;

          return (
            <Card key={quiz.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-start gap-2">
                  <span className="shrink-0 text-muted-foreground">Q{qi + 1}.</span>
                  <span>{quiz.question}</span>
                  {submitted && (
                    <Badge
                      variant={isCorrect ? "default" : "destructive"}
                      className="ml-auto shrink-0"
                    >
                      {isCorrect ? "Correct" : "Wrong"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quiz.options.map((option, idx) => {
                  const isSelected = selected === idx;
                  const isRightAnswer = submitted && idx === correct;
                  const isWrongSelected = submitted && isSelected && idx !== correct;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(quiz.id, idx)}
                      className={[
                        "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors",
                        !submitted && isSelected
                          ? "border-primary bg-primary/10"
                          : !submitted
                          ? "border-border hover:bg-muted/50"
                          : isRightAnswer
                          ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                          : isWrongSelected
                          ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                          : "border-border opacity-60",
                      ].join(" ")}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                      {option}
                    </button>
                  );
                })}

                {isWrong && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    Correct answer: {quiz.options[correct]}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}

        {!submitted && (
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < quizzes.length}
            className="w-full"
          >
            Submit ({Object.keys(answers).length}/{quizzes.length} answered)
          </Button>
        )}
      </main>
    </div>
  );
}
