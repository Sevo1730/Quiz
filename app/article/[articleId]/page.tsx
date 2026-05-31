"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Quiz {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  createdAt: string;
  quizzes: Quiz[];
}

export default function ArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = use(params);
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/article/${articleId}`)
      .then((r) => r.json())
      .then((data) => {
        setArticle(data);
        setLoading(false);
      });
  }, [articleId]);

  async function handleGenerateQuiz() {
    setGenerating(true);
    const res = await fetch(`/api/article/${articleId}/quizzes`, {
      method: "POST",
    });
    if (res.ok) {
      toast.success("Quiz generated!");
      router.push(`/article/${articleId}/quiz`);
    } else {
      toast.error("Failed to generate quiz");
    }
    setGenerating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Article not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Dashboard
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">{article.title}</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{article.summary}</p>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex gap-3">
          <Button onClick={handleGenerateQuiz} disabled={generating}>
            {generating ? "Generating..." : "Generate Quiz"}
          </Button>
          {article.quizzes.length > 0 && (
            <Button variant="outline" onClick={() => router.push(`/article/${articleId}/quiz`)}>
              Retake Quiz
            </Button>
          )}
        </div>

        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            View full article
          </summary>
          <p className="mt-4 leading-relaxed whitespace-pre-wrap text-sm">{article.content}</p>
        </details>
      </main>
    </div>
  );
}
