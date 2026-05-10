"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { gangnamSections } from "@/data/gangnamItems"
import { cheongjigiSections } from "@/data/cheongjigiItems"

const getKoreaNow = () => {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Seoul",
    })
  )
}

type PrepareLog = {
  id: number
  store: string
  session_key: string
  item_name: string
  checked: boolean
  quantity: number
  created_at: string
}

type SessionGroup = {
  key: string
  label: string
  store: string
  logs: PrepareLog[]
}

type DateGroup = {
  date: string
  sessions: SessionGroup[]
}

export default function HistoryPage() {
  const router = useRouter()

  const [groups, setGroups] = useState<DateGroup[]>([])
  const [openDate, setOpenDate] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const getDateFromSessionKey = (sessionKey: string) => {
    return sessionKey.replace("-lunch", "").replace("-dinner", "")
  }

  const makeLabel = (store: string, sessionKey: string) => {
    if (store === "gangnam" && sessionKey.endsWith("-lunch")) {
      return "강남점 점심"
    }

    if (store === "gangnam" && sessionKey.endsWith("-dinner")) {
      return "강남점 저녁"
    }

    if (store === "cheongjigi") {
      return "청지기"
    }

    return store
  }

  const getSessionOrder = (store: string, sessionKey: string) => {
    if (store === "gangnam" && sessionKey.endsWith("-lunch")) return 1
    if (store === "gangnam" && sessionKey.endsWith("-dinner")) return 2
    if (store === "cheongjigi") return 3
    return 99
  }

  const mergeItemsBySections = (logs: PrepareLog[], store: string) => {
    const sections = store === "gangnam" ? gangnamSections : cheongjigiSections

    const result: string[] = []

    sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.type === "empty") return

        const itemLogs = logs.filter((log) => log.item_name === item.name)

        if (item.type === "check") {
          const checked = itemLogs.some((log) => log.checked)

          if (checked) {
            result.push(item.name)
          }

          return
        }

        const totalQuantity = itemLogs.reduce(
          (sum, log) => sum + (log.quantity || 0),
          0
        )

        if (totalQuantity > 0) {
          result.push(`${item.name}${totalQuantity}`)
        }
      })
    })

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

    const sessionMap = new Map<string, PrepareLog[]>()

    data?.forEach((log) => {
      if (!log.session_key) return

      const key = `${log.store}_${log.session_key}`
      const current = sessionMap.get(key) || []

      current.push(log)
      sessionMap.set(key, current)
    })

    const sessionGroups: SessionGroup[] = Array.from(sessionMap.entries()).map(
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

    const dateMap = new Map<string, SessionGroup[]>()

    sessionGroups.forEach((group) => {
      const date = getDateFromSessionKey(group.logs[0].session_key)
      const current = dateMap.get(date) || []

      current.push(group)
      dateMap.set(date, current)
    })

    const result: DateGroup[] = Array.from(dateMap.entries())
      .map(([date, sessions]) => ({
        date,
        sessions: sessions.sort(
          (a, b) =>
            getSessionOrder(a.store, a.logs[0].session_key) -
            getSessionOrder(b.store, b.logs[0].session_key)
        ),
      }))
      .sort((a, b) => b.date.localeCompare(a.date))

    setGroups(result)

    if (result.length > 0) {
      setOpenDate(result[0].date)
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
            <p className="text-sm text-stone-500">일자별 주문내역</p>
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
            {groups.map((dateGroup) => {
              const isOpen = openDate === dateGroup.date

              return (
                <div
                  key={dateGroup.date}
                  className="rounded-2xl bg-white p-3 shadow-sm"
                >
                  <button
                    onClick={() => setOpenDate(isOpen ? "" : dateGroup.date)}
                    className={`
                      w-full rounded-xl px-4 py-3
                      text-left text-lg font-bold
                      ${
                        isOpen
                          ? "bg-black text-white"
                          : "bg-stone-100 text-black"
                      }
                    `}
                  >
                    {dateGroup.date}
                  </button>

                  {isOpen && (
                    <div className="mt-3 flex flex-col gap-3">
                      {dateGroup.sessions.map((session) => {
                        const items = mergeItemsBySections(
                          session.logs,
                          session.store
                        )

                        return (
                          <div
                            key={session.key}
                            className="rounded-xl bg-stone-50 p-4"
                          >
                            <h2 className="mb-2 text-base font-bold text-stone-500">
                              {session.label}
                            </h2>

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
                        )
                      })}
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