"use client";

import { useState, useRef, FormEvent } from "react";
import { Socket } from "socket.io-client";

interface TextTabProps {
  socket: Socket;
  roomId: string;
  senderName: string;
}

export default function TextTab({ socket, roomId, senderName }: TextTabProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const sendText = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    socket.emit("send_text", { roomId, content: text.trim(), senderName });
    setText("");
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={sendText} className="flex gap-3" style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius)" }}>
      <input
        ref={inputRef}
        className="input"
        style={{ marginBottom: 0, flex: 1 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe un mensaje..."
        autoComplete="off"
      />
      <button type="submit" className="btn btn-primary" style={{ width: "auto", flexShrink: 0 }} disabled={!text.trim()}>
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      </button>
    </form>
  );
}
