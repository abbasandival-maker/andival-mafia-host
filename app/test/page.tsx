import Link from "next/link";
import Button from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0B0F] flex items-center justify-center px-6 text-white">
      <div className="w-full max-w-md">
        <div className="mb-14 text-center">
          <h1 className="text-5xl font-black tracking-wide">
            AndivaL
          </h1>

          <h2 className="mt-2 text-2xl font-semibold text-yellow-400">
            Mafia Host
          </h2>

          <p className="mt-5 text-gray-400">
            Professional Real-Time Mafia Platform
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/create" className="block">
            <Button>
              🎮 Create Game
            </Button>
          </Link>

          <Link href="/join" className="block">
            <Button variant="secondary">
              🚪 Join Game
            </Button>
          </Link>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          Version 1.0.0 MVP
        </div>
      </div>
    </main>
  );
}