"use client"

import { useEffect, useState } from "react"

/**
 * Shows a warning banner when the daily demo reset is approaching.
 * Displays a countdown in the last 5 minutes before midnight UTC.
 */
export function ResetCountdown() {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null)

  useEffect(() => {
    function update() {
      const now = new Date()
      const utcHour = now.getUTCHours()
      const utcMinute = now.getUTCMinutes()

      // Calculate minutes until midnight UTC
      const minutesToMidnight = (23 - utcHour) * 60 + (60 - utcMinute)

      if (minutesToMidnight <= 5) {
        setMinutesLeft(minutesToMidnight)
      } else {
        setMinutesLeft(null)
      }
    }

    update()
    const interval = setInterval(update, 10_000) // check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  if (minutesLeft === null) return null

  return (
    <div className="bg-amber-500 text-amber-950 text-center text-sm py-1.5 px-4 font-medium">
      Demo reset in {minutesLeft <= 1 ? "less than a minute" : `${minutesLeft} minutes`} — all content will be restored to defaults.
    </div>
  )
}
