import ChatBox from "./components/ChatBox";

export default function Home() {
  return (
    <main className="flex h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Home</h1>
      <ChatBox />
    </main>
  );
}
