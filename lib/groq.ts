import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function summarizeArticle(content: string): Promise<string> {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `Please provide a concise summary of the following article: ${content}`,
      },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}

export async function generateQuiz(
  articleContent: string
): Promise<{ question: string; options: string[]; answer: string }[]> {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `Generate 5 multiple choice questions based on this article: ${articleContent}. Return ONLY valid JSON array, no explanation, no markdown, no code block. Format:
[
  {
    "question": "Question text here",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "answer": "0"
  }
]
The answer field must be the index (0-3) of the correct option as a string.`,
      },
    ],
  });

  const text = res.choices[0]?.message?.content ?? "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Failed to parse quiz JSON from Groq");
  return JSON.parse(jsonMatch[0]);
}
