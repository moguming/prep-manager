"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { ArrowLeft, Check } from "lucide-react"

import { supabase } from "@/lib/supabase"

type PrepareLog = {
  id: number
  store: string
  item_name: string
  checked: boolean
  quantity: number
  created_at: string
}

export default function BossPage() {
  const router = useRouter()

  const [logs, setLogs] = useState<PrepareLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("prepare_logs")
      .select("*")
      .eq("store", "gangnam")
      .order("created_at", { ascending: false })

    if (error) {
      console.log(error)
      alert("데이터 불러오기 실패")
      return
    }

    const filtered =
      data?.filter(
        (item) =>
          item.checked === true ||
          item.quantity > 0
      ) || []

    setLogs(filtered)
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <main className="min-h-screen bg-stone-100 p-4">
      <div className="mx-auto max-w-md">

        <div className="mb-5 flex items-center gap-3">

          <button
            onClick={() => router.push("/")}
            className="
              w-11 h-11 rounded-full
              bg-white shadow-sm
              flex items-center justify-center
            "
          >
            <ArrowLeft size={24} />
          </button>

          <div>
            <h1 className="text-3xl font-bold">
              사장님 화면
            </h1>

            <p className="mt-1 text-sm text-stone-500">
              강남점 준비 완료 항목
            </p>
          </div>

        </div>

        {loading ? (

          <div className="bg-white rounded-2xl p-5 text-center font-bold">
            불러오는 중...
          </div>

        ) : logs.length === 0 ? (

          <div className="bg-white rounded-2xl p-5 text-center font-bold">
            체크된 항목이 없습니다
          </div>

        ) : (

          <div className="flex flex-col gap-3">

            {logs.map((log) => (

              <div
                key={log.id}
                className="
                  bg-white rounded-2xl p-4
                  flex items-center justify-between
                  shadow-sm
                "
              >

                <div className="flex items-center gap-3">

                  <div className="
                    w-10 h-10 rounded-full
                    bg-green-500 text-white
                    flex items-center justify-center
                  ">
                    <Check size={22} />
                  </div>

                  <span className="text-xl font-bold">
                    {log.item_name}
                  </span>

                </div>

                {log.quantity > 0 && (
                  <span className="text-xl font-bold">
                    {log.quantity}개
                  </span>
                )}

              </div>

            ))}

          </div>

        )}

      </div>
    </main>
  )
}