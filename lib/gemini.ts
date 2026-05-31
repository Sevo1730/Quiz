import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export async function summarizeArticle(content: string): Promise<string> {
  const result = await geminiModel.generateContent(
    `Please provide a concise summary of the following article: ${content}`
  );
  return result.response.text();
}

export async function generateQuiz(
  articleContent: string
): Promise<{ question: string; options: string[]; answer: string }[]> {
  const prompt = `Generate 5 multiple choice questions based on this article: ${articleContent}. Return the response in this exact JSON format:
[
  {
    "question": "Question text here",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "answer": "0"
  }
]
Make sure the response is valid JSON and the answer is the index (0-3) of the correct option.`;

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Failed to parse quiz JSON from Gemini");

  return JSON.parse(jsonMatch[0]);
}
