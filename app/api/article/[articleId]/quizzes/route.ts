import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuiz } from "@/lib/groq";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { articleId } = await params;

  const article = await prisma.article.findFirst({
    where: { id: articleId, userId },
  });

  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.quiz.deleteMany({ where: { articleId } });

  const questions = await generateQuiz(article.content);

  const quizzes = await prisma.$transaction(
    questions.map((q) =>
      prisma.quiz.create({
        data: {
          question: q.question,
          options: q.options,
          answer: q.answer,
          articleId,
        },
      })
    )
  );

  return NextResponse.json(quizzes, { status: 201 });
}
