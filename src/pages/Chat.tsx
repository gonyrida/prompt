import { useState } from "react";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", content: "You are a helpful assistant." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: "user", content: trimmed } as ChatMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || "Request failed");
      }
      const assistantContent: string = data?.content || "";
      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col h-[calc(100vh-4rem)]">
      <h1 className="text-2xl font-semibold mb-4">Chatbot</h1>

      <div className="flex-1 overflow-y-auto border rounded-lg p-4 space-y-3 bg-background/40">
        {messages
          .filter((m) => m.role !== "system")
          .map((m, i) => (
            <div key={i} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm shadow-sm ${
                  m.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        {loading && (
          <div className="text-muted-foreground text-sm">Thinking…</div>
        )}
        {error && (
          <div className="text-red-500 text-sm">Error: {error}</div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 border rounded-md px-3 py-2 text-sm"
          placeholder="Type your message and press Enter…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
        />
        <button
          className="border rounded-md px-4 py-2 text-sm bg-primary text-primary-foreground disabled:opacity-50"
          onClick={sendMessage}
          disabled={loading}
        >
          Send
        </button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        This demo calls the backend at <code>/api/chat</code> which securely uses your <code>OPENAI_API_KEY</code> server-side.
      </p>
    </div>
  );
}
