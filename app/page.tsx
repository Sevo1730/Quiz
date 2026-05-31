import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4">
      <h1 className="text-4xl font-bold">Quiz App</h1>
      <p className="text-gray-500 max-w-md">
        Summarize articles with AI and generate quizzes to test your knowledge.
      </p>
      <div className="flex gap-3">
        <Link
          href="/sign-in"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
