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

  // 강남점
  // 12~20 lunch
  // 20~다음날11:59 dinner
  const getGangnamSessionKey = () => {
    const now = new Date()
    const hour = now.getHours()

    const date = new Date(now)

    if (hour < 12) {
      date.setDate(date.getDate() - 1)
    }

    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")

    const session =
      hour >= 12 && hour < 20
        ? "lunch"
        : "dinner"

    return `${yyyy}-${mm}-${dd}-${session}`
  }

  // 청지기
  // 13시 기준 하루 초기화
  const getCheongjigiSessionKey = () => {
    const now = new Date()
    const hour = now.getHours()

    const date = new Date(now)

    if (hour < 13) {
      date.setDate(date.getDate() - 1)
    }

    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")

    return `${yyyy}-${mm}-${dd}`
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

        quantityMap.set(
          log.item_name,
          current + log.quantity
        )
      }
    })

    const result: string[] = []

    checkedSet.forEach((name) => {
      result.push(name)
    })

    quantityMap.forEach((quantity, name) => {
      result.push(`${name}${quantity}`)
    })

    return result
  }

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

      const sectionItemNames = section.items
        .filter((item) => item.type !== "empty")
        .map((item) => item.name)

      const sectionLogs = logs.filter((log) =>
        sectionItemNames.includes(log.item_name)
      )

      return {
        title: section.title,
        items: mergeItems(sectionLogs),
      }
    })
  }

  const fetchLogs = async () => {
    setLoading(true)

    const gangnamSessionKey =
      getGangnamSessionKey()

    const cheongjigiSessionKey =
      getCheongjigiSessionKey()

    const { data, error } = await supabase
      .from("prepare_logs")
      .select("*")
      .in("store", ["gangnam", "cheongjigi"])
      .order("created_at", {
        ascending: true,
      })

    if (error) {
      console.log(error)
      alert("데이터 불러오기 실패")
      setLoading(false)
      return
    }

    const gangnamLogs =
      data?.filter(
        (item) =>
          item.store === "gangnam" &&
          item.session_key ===
            gangnamSessionKey
      ) || []

    const cheongjigiLogs =
      data?.filter(
        (item) =>
          item.store === "cheongjigi" &&
          item.session_key ===
            cheongjigiSessionKey
      ) || []

    setGangnamResult(
      makeSectionResult(
        gangnamLogs,
        gangnamSections
      )
    )

    setCheongjigiResult(
      makeSectionResult(
        cheongjigiLogs,
        cheongjigiSections
      )
    )

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
              <h1 className="text-2xl font-bold">
                사장님 화면
              </h1>

              {/* <p className="text-sm text-stone-500">
                준비물 현황 */}
              {/* </p> */}
            </div>
          </div>

          <button
            onClick={() => router.push("/boss/history")}
            className="
              h-10 px-3 rounded-xl
              bg-black text-white
              text-sm font-bold
              shadow-sm
            "
          >
            목록보기
          </button>
        </div>


        {loading ? (

          <div className="
            rounded-2xl bg-white
            p-5 text-center font-bold
          ">
            불러오는 중...
          </div>

        ) : (

          <div className="
            flex flex-col gap-4
          ">

            <StoreBox
              title="강남점"
              sections={gangnamResult}
            />

            <StoreBox
              title="청지기"
              sections={cheongjigiResult}
            />

            <div className="
              rounded-2xl bg-white
              p-4 shadow-sm
            ">

              <h2 className="
                mb-2 text-lg font-bold
              ">
                메모
              </h2>

              <textarea
                value={memo}
                onChange={(e) =>
                  setMemo(e.target.value)
                }
                placeholder="
                "
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
    <div className="
      rounded-2xl bg-white
      p-4 shadow-sm
    ">

      <h2 className="
        mb-4 text-xl font-bold
      ">
        {title}
      </h2>

      <div className="
        flex flex-col gap-4
      ">

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

      <h3 className="
        mb-1 text-base
        font-bold text-stone-500
      ">
        {title}
      </h3>

      {items.length === 0 ? (

        <p className="text-stone-300">
          없음
        </p>

      ) : (

        <p className="
          text-xl font-bold
          leading-relaxed
        ">
          {items.join(" ")}
        </p>

      )}

    </div>
  )
}