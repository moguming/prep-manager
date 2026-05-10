"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ArrowLeft } from "lucide-react"

import { cheongjigiSections } from "@/data/cheongjigiItems"
import { supabase } from "@/lib/supabase"

export default function CheongjigiPage() {
  const router = useRouter()

  const [checkedItems, setCheckedItems] = useState<string[]>([])

  const getSessionKey = () => {
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

  const toggleCheck = (name: string) => {
    setCheckedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    )
  }

  const saveData = async () => {
    const sessionKey = getSessionKey()

    const rows = cheongjigiSections.flatMap((section) =>
      section.items
        .filter((item) => item.type === "check")
        .map((item) => ({
          store: "cheongjigi",
          session_key: sessionKey,
          item_name: item.name,
          checked: checkedItems.includes(item.name),
          quantity: 0,
        }))
    )

    const { error } = await supabase.from("prepare_logs").insert(rows)

    if (error) {
      console.log(error)
      alert("저장 실패")
      return
    }

    alert("저장 완료!")
  }

  return (
    <main className="min-h-screen bg-stone-100 p-3">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/")}
              className="
                w-10 h-10 rounded-full bg-white shadow-sm
                flex items-center justify-center
              "
            >
              <ArrowLeft size={22} />
            </button>

            <div>
              <h1 className="text-2xl font-bold">청지기 준비물</h1>
            </div>
          </div>

          <button
            onClick={saveData}
            className="
              h-10 px-4 rounded-xl
              bg-black text-white
              text-sm font-bold shadow-sm
            "
          >
            저장
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {cheongjigiSections.map((section) => (
            <div key={section.title}>
              <h2 className="mb-2 text-lg font-bold text-stone-700">
                {section.title}
              </h2>

              <div className="grid grid-cols-5 gap-2">
                {section.items.map((item, index) => {
                  if (item.type === "empty") {
                    return <div key={`empty-${index}`} />
                  }

                  const checked = checkedItems.includes(item.name)

                  return (
                    <button
                      key={item.name}
                      onClick={() => toggleCheck(item.name)}
                      className={`
                        min-h-[58px] rounded-xl p-1
                        flex flex-col items-center justify-center gap-1
                        text-[15px] font-bold shadow-sm transition
                        ${
                          checked
                            ? "bg-green-500 text-white"
                            : "bg-white text-black"
                        }
                      `}
                    >
                      <span className="text-center leading-tight">
                        {item.name}
                      </span>

                      {checked ? (
                        <Check size={16} strokeWidth={3} />
                      ) : (
                        <span className="h-4" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}