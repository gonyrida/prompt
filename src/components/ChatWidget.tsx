import { useState } from "react";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function ChatWidget() {
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
        const detail = typeof data?.details === 'string' ? data.details : (data?.details?.error || "");
        const msg = [data?.error, detail].filter(Boolean).join(": ");
        throw new Error(msg || "Request failed");
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
    <div className="flex flex-col h-[520px] w-[380px] sm:w-[420px]">
      <div className="pb-3 border-b">
        <h3 className="text-base font-semibold">Chatbot</h3>
        <p className="text-xs text-muted-foreground">Ask me anything about development resources.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
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

      <div className="mt-2 flex gap-2">
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
    </div>
  );
}
