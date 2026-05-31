import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { summarizeArticle } from "@/lib/groq";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const user = await currentUser();
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: user?.emailAddresses[0]?.emailAddress ?? "" },
  });

  const summary = await summarizeArticle(content);

  const article = await prisma.article.create({
    data: { title, content, summary, userId },
  });

  return NextResponse.json(article, { status: 201 });
}
