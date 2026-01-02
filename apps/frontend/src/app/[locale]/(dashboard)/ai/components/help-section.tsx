import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function HelpSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How to get the best results</CardTitle>
        <CardDescription>
          Tips for configuring your AI Assistant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div className="space-y-2">
          <h3 className="font-semibold text-base">1. Crafting the Perfect System Prompt</h3>
          <p className="text-muted-foreground">
            The System Prompt defines the AI's personality and rules. It is the most critical setting.
          </p>
          <div className="bg-muted p-4 rounded-md border">
            <p className="font-mono text-xs mb-2 text-primary">Recommended Prompt:</p>
            <pre className="whitespace-pre-wrap font-mono text-xs text-foreground">
{`You are a helpful and polite customer support assistant for [Your Company Name].
Your task is to answer customer questions using ONLY the information provided in the "Relevant Context" section below.

Rules:
1. Use the provided context to answer the question.
2. If the answer is not in the context, politely say: "I'm sorry, I don't have that information in my knowledge base."
3. Do NOT make up answers or use outside knowledge.
4. Keep answers concise and professional.`}
            </pre>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-base">2. Optimizing Knowledge Base Documents</h3>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li><strong>Format:</strong> Use clear headings and concise paragraphs in your PDFs.</li>
            <li><strong>Q&A Style:</strong> Including a FAQ section in your PDF helps the AI understand common questions.</li>
            <li><strong>Clarity:</strong> Avoid ambiguous language. The AI retrieves text based on similarity, so use keywords your customers use.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-base">3. Troubleshooting</h3>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>If the AI says "I don't know" too often, try adding more detailed information to your PDF.</li>
            <li>If the AI hallucinates (makes things up), ensure your System Prompt strictly forbids outside knowledge (use the word "ONLY").</li>
            <li>Check the document status in the "Knowledge Base" tab to ensure it is "COMPLETED".</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}