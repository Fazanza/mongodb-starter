import { useState } from "react";
export default function Chat() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input) return;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      setResponse(data.choices?.[0]?.message?.content || "No response");
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setResponse("Error connecting to AI");
    }
  };

  return (
    <div>
      <h1>AI Chat</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
        />
        <button type="submit">Send</button>
      </form>
      {response && <p><strong>AI:</strong> {response}</p>}
    </div>
  );
}
