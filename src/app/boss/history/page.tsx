"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { supabase } from "@/lib/supabase"

type PrepareLog = {
  id: number
  store: string
  session_key: string
  item_name: string
  checked: boolean
  quantity: number
  created_at: string
}

type HistoryGroup = {
  key: string
  label: string
  store: string
  logs: PrepareLog[]
}

export default function HistoryPage() {
  const router = useRouter()

  const [groups, setGroups] = useState<HistoryGroup[]>([])
  const [openKey, setOpenKey] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const makeLabel = (store: string, sessionKey: string) => {
    const storeName = store === "gangnam" ? "강남점" : "청지기"

    if (sessionKey.includes("lunch")) {
      return `${sessionKey.replace("-lunch", "")} ${storeName} 점심`
    }

    if (sessionKey.includes("dinner")) {
      return `${sessionKey.replace("-dinner", "")} ${storeName} 저녁`
    }

    return `${sessionKey} ${storeName}`
  }

  const mergeItems = (logs: PrepareLog[]) => {
    const checkedSet = new Set<string>()
    const quantityMap = new Map<string, number>()

    logs.forEach((log) => {
      if (log.checked) {
        checkedSet.add(log.item_name)
      }

      if (log.quantity > 0) {
        const current = quantityMap.get(log.item_name) || 0
        quantityMap.set(log.item_name, current + log.quantity)
      }
    })

    const result: string[] = []

    checkedSet.forEach((name) => result.push(name))
    quantityMap.forEach((quantity, name) => result.push(`${name}${quantity}`))

    return result
  }

  const fetchHistory = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("prepare_logs")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.log(error)
      alert("지난 주문내역 불러오기 실패")
      setLoading(false)
      return
    }

    const map = new Map<string, PrepareLog[]>()

    data?.forEach((log) => {
      if (!log.session_key) return

      const key = `${log.store}_${log.session_key}`
      const current = map.get(key) || []

      current.push(log)
      map.set(key, current)
    })

    const result: HistoryGroup[] = Array.from(map.entries()).map(
      ([key, logs]) => {
        const store = logs[0].store
        const sessionKey = logs[0].session_key

        return {
          key,
          store,
          label: makeLabel(store, sessionKey),
          logs,
        }
      }
    )

    setGroups(result)

    if (result.length > 0) {
      setOpenKey(result[0].key)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  return (
    <main className="min-h-screen bg-stone-100 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => router.push("/boss")}
            className="
              w-10 h-10 rounded-full
              bg-white shadow-sm
              flex items-center justify-center
            "
          >
            <ArrowLeft size={22} />
          </button>

          <div>
            <h1 className="text-2xl font-bold">주문내역 목록</h1>
            <p className="text-sm text-stone-500">
              일자별 주문내역
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-5 text-center font-bold">
            불러오는 중...
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 text-center font-bold">
            주문내역이 없습니다
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((group) => {
              const isOpen = openKey === group.key
              const items = mergeItems(group.logs)

              return (
                <div
                  key={group.key}
                  className="rounded-2xl bg-white p-3 shadow-sm"
                >
                  <button
                    onClick={() =>
                      setOpenKey(isOpen ? "" : group.key)
                    }
                    className={`
                      w-full rounded-xl px-4 py-3
                      text-left text-base font-bold
                      ${
                        isOpen
                          ? "bg-black text-white"
                          : "bg-stone-100 text-black"
                      }
                    `}
                  >
                    {group.label}
                  </button>

                  {isOpen && (
                    <div className="mt-3 rounded-xl bg-stone-50 p-4">
                      <p className="mb-2 text-sm font-bold text-stone-500">
                        {group.store === "gangnam" ? "강남점" : "청지기"} 주문내역
                      </p>

                      {items.length === 0 ? (
                        <p className="text-stone-400">
                          주문 항목 없음
                        </p>
                      ) : (
                        <p className="text-xl font-bold leading-relaxed">
                          {items.join(" ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}