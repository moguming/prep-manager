"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Plus, Minus, ArrowLeft } from "lucide-react"

import { gangnamSections } from "@/data/gangnamItems"
import { supabase } from "@/lib/supabase"

const getKoreaNow = () => {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Seoul",
    })
  )
}

export default function GangnamPage() {
  const router = useRouter()

  const [checkedItems, setCheckedItems] = useState<string[]>([])
  const [quantityItems, setQuantityItems] = useState<Record<string, number>>({})

  const toggleCheck = (name: string) => {
    setCheckedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    )
  }

  const increaseQuantity = (name: string) => {
    setQuantityItems((prev) => ({
      ...prev,
      [name]: (prev[name] || 0) + 1,
    }))
  }

  const decreaseQuantity = (name: string) => {
    setQuantityItems((prev) => ({
      ...prev,
      [name]: Math.max((prev[name] || 0) - 1, 0),
    }))
  }


  const getSessionKey = () => {
    const now = getKoreaNow()
    const hour = now.getHours()

    const date = new Date(now)

    if (hour < 12) {
      date.setDate(date.getDate() - 1)
    }

    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")

    const session = hour >= 12 && hour < 20 ? "lunch" : "dinner"

    return `${yyyy}-${mm}-${dd}-${session}`
  }

  const saveData = async () => {
    const sessionKey = getSessionKey()

    const rows = gangnamSections.flatMap((section) =>
      section.items
        .filter((item) => item.type !== "empty")
        .map((item) => {
          if (item.type === "check") {
            return {
              store: "gangnam",
              session_key: sessionKey,
              item_name: item.name,
              checked: checkedItems.includes(item.name),
              quantity: 0,
            }
          }

          return {
            store: "gangnam",
            session_key: sessionKey,
            item_name: item.name,
            checked: false,
            quantity: quantityItems[item.name] || 0,
          }
        })
    )

    const { error: insertError } = await supabase
      .from("prepare_logs")
      .insert(rows)

    if (insertError) {
      console.log(insertError)
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
              <h1 className="text-2xl font-bold">강남점 준비물</h1>
              {/* <p className="mt-1 text-xs text-stone-500">
                준비된 항목을 눌러 체크해주세요
              </p> */}
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

          {gangnamSections.map((section) => (

            <div key={section.title}>

              <h2 className="mb-2 text-lg font-bold text-stone-700">
                {section.title}
              </h2>

              <div className="grid grid-cols-5 gap-2">

                {section.items.map((item) => {

                  if (item.type === "empty") {
                    return <div key={Math.random()} />
                  }

                  if (item.type === "check") {

                    const checked =
                      checkedItems.includes(item.name)

                    return (
                      <button
                        key={item.name}
                        onClick={() => toggleCheck(item.name)}
                        className={`
                          min-h-[40px] rounded-xl p-1
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

                        {/* {checked ? (
                          <Check size={20} strokeWidth={3} />
                        ) : (
                          <span className="h-5" />
                        )} */}

                      </button>
                    )
                  }

                  const quantity =
                    quantityItems[item.name] || 0

                  return (
                    <div
                      key={item.name}
                      className="
                        min-h-[10px] rounded-xl bg-white p-1
                        flex flex-col items-center justify-center gap-1
                        shadow-sm
                      "
                    >

                      <span className="
                        text-center text-[15px] font-bold leading-tight
                      ">
                        {item.name}
                      </span>

                      <div className="flex items-center gap-1">

                        <button
                          onClick={() =>
                            decreaseQuantity(item.name)
                          }
                          className="
                            w-6 h-6 rounded-full bg-stone-200
                            flex items-center justify-center
                          "
                        >
                          <Minus size={14} />
                        </button>

                        <span className="
                          w-5 text-center text-base font-bold
                        ">
                          {quantity}
                        </span>

                        <button
                          onClick={() =>
                            increaseQuantity(item.name)
                          }
                          className="
                            w-6 h-6 rounded-full bg-black text-white
                            flex items-center justify-center
                          "
                        >
                          <Plus size={14} />
                        </button>

                      </div>

                    </div>
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