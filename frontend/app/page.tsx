'use client'

import { useState } from "react";
import ChatBox from "./components/ChatBox";
import { useChatSocket } from "./lib/useChatSocket";

const DEFAULT_WS_URL = "ws://localhost:8080";

export default function Home() {

  const {
    status,
    messages: wsMessages,
    stats,
    sendMessage
  } = useChatSocket();

  const [message, setMessage] = useState<string>("");
  console.log("message received from server ::", message);


  return (
    <main className="flex h-screen items-center justify-center flex flex-col gap-3">
      <div className="w-full h-96 border-2 border-black rounded-2xl">
        message received from server ::
        {wsMessages.map((message) => (
          <>
            <div>{message.content}</div>
          </>
        ))}
      </div>
      <form onSubmit={(e) => {

        e.preventDefault()

        sendMessage(message)
        console.log("message sent ::", message);
        setMessage("")
      }
      } className="flex flex-col gap-3">

        <input
          className="border-2 border-black rounded-2xl"
          type="text" placeholder="enter message" onChange={(e) => setMessage(e.target.value)} value={message} />
        <button className="border-2 border-gray-600 bg-blue-400 rounded-2xl" type="submit">send message</button>
      </form>

    </main >
  );
}
