import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const articles = await prisma.article.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { quizzes: { select: { id: true } } },
  });

  return NextResponse.json(articles);
}
