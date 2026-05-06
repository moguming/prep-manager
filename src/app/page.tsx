"use client"

import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 p-6">

      <h1 className="text-3xl font-bold mb-10">
        준비물 관리
      </h1>

      <button
        onClick={() => router.push("/store/gangnam")}
        className="w-full max-w-sm h-16 rounded-2xl bg-black text-white text-xl font-bold"
      >
        강남점
      </button>

      <button
        onClick={() => router.push("/store/cheongjigi")}
        className="w-full max-w-sm h-16 rounded-2xl bg-black text-white text-xl font-bold"
      >
        청지기
      </button>

      <button
        onClick={() => router.push("/boss")}
        className="w-full max-w-sm h-16 rounded-2xl bg-red-500 text-white text-xl font-bold"
      >
        사장님 챙겨주세요
      </button>

    </main>
  )
}