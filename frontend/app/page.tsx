'use client'

import { useState } from "react";
import ChatBox from "./components/ChatBox";
import { useChatSocket } from "./lib/useChatSocket";

const DEFAULT_WS_URL = "ws://localhost:8080";

export default function Home() {

  const {
    status,
    messages,
    stats,
    sendMessage
  } = useChatSocket();

  const [message, setMessage] = useState<string>("");

  return (
    <main className="flex h-screen items-center justify-center">
      <form onSubmit={(e) => {

        e.preventDefault()

        sendMessage(message)
      }
      } className="flex flex-col gap-3">

        <input
          className="border-2 border-black rounded-2xl"
          type="text" placeholder="enter message" onChange={(e) => setMessage(e.target.value)} />
        <button className="border-2 border-gray-600 bg-blue-400 rounded-2xl" type="submit">send message</button>
      </form>

    </main >
  );
}
