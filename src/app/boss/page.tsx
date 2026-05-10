"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { gangnamSections } from "@/data/gangnamItems"
import { cheongjigiSections } from "@/data/cheongjigiItems"

type PrepareLog = {
  id: number
  store: string
  session_key: string
  item_name: string
  checked: boolean
  quantity: number
  created_at: string
}

type SectionResult = {
  title: string
  items: string[]
}

export default function BossPage() {
  const router = useRouter()

  const [gangnamResult, setGangnamResult] = useState<SectionResult[]>([])
  const [cheongjigiResult, setCheongjigiResult] = useState<SectionResult[]>([])
  const [memo, setMemo] = useState("")
  const [loading, setLoading] = useState(true)

  const makeSectionResult = (
    logs: PrepareLog[],
    sections: readonly {
      readonly title: string
      readonly items: readonly (
        | { readonly type: "check"; readonly name: string }
        | { readonly type: "quantity"; readonly name: string }
        | { readonly type: "empty" }
      )[]
    }[]
  ) => {
    return sections.map((section) => {
      const items = section.items
        .filter((item) => item.type !== "empty")
        .map((item) => {
          const itemLogs = logs.filter((log) => log.item_name === item.name)

          if (item.type === "check") {
            const checked = itemLogs.some((log) => log.checked)
            return checked ? item.name : null
          }

          if (item.type === "quantity") {
            const totalQuantity = itemLogs.reduce(
              (sum, log) => sum + (log.quantity || 0),
              0
            )

            return totalQuantity > 0 ? `${item.name}${totalQuantity}` : null
          }

          return null
        })
        .filter((item): item is string => item !== null)

      return {
        title: section.title,
        items,
      }
    })
  }

  const fetchLogs = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("prepare_logs")
      .select("*")
      .in("store", ["gangnam", "cheongjigi"])
      .order("created_at", { ascending: false })

    if (error) {
      console.log(error)
      alert("데이터 불러오기 실패")
      setLoading(false)
      return
    }

    const logs = data || []

    const latestGangnamSessionKey = logs.find(
      (log) => log.store === "gangnam"
    )?.session_key

    const latestCheongjigiSessionKey = logs.find(
      (log) => log.store === "cheongjigi"
    )?.session_key

    const gangnamLogs = logs.filter(
      (log) =>
        log.store === "gangnam" &&
        log.session_key === latestGangnamSessionKey
    )

    const cheongjigiLogs = logs.filter(
      (log) =>
        log.store === "cheongjigi" &&
        log.session_key === latestCheongjigiSessionKey
    )

    setGangnamResult(makeSectionResult(gangnamLogs, gangnamSections))
    setCheongjigiResult(makeSectionResult(cheongjigiLogs, cheongjigiSections))

    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <main className="min-h-screen bg-stone-100 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="
                w-10 h-10 rounded-full
                bg-white shadow-sm
                flex items-center justify-center
              "
            >
              <ArrowLeft size={22} />
            </button>

            <div>
              <h1 className="text-2xl font-bold">사장님 화면</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchLogs}
              className="
                h-10 px-3 rounded-xl
                bg-stone-200 text-black
                text-sm font-bold shadow-sm
              "
            >
              새로고침
            </button>

            <button
              onClick={() => router.push("/boss/history")}
              className="
                h-10 px-3 rounded-xl
                bg-black text-white
                text-sm font-bold shadow-sm
              "
            >
              목록보기
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-5 text-center font-bold">
            불러오는 중...
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <StoreBox title="강남점" sections={gangnamResult} />
            <StoreBox title="청지기" sections={cheongjigiResult} />

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-lg font-bold">메모</h2>

              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="
                  min-h-[120px]
                  w-full resize-none
                  rounded-xl
                  border border-stone-200
                  p-3 text-base
                  outline-none
                "
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function StoreBox({
  title,
  sections,
}: {
  title: string
  sections: SectionResult[]
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>

      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <SectionBox
            key={section.title}
            title={section.title}
            items={section.items}
          />
        ))}
      </div>
    </div>
  )
}

function SectionBox({
  title,
  items,
}: {
  title: string
  items: string[]
}) {
  return (
    <div>
      <h3 className="mb-1 text-base font-bold text-stone-500">{title}</h3>

      {items.length === 0 ? (
        <p className="text-stone-300">없음</p>
      ) : (
        <p className="text-xl font-bold leading-relaxed">
          {items.join(" ")}
        </p>
      )}
    </div>
  )
}