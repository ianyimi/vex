"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { type ComponentPropsWithRef } from "react"

import { Button } from "~/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

export function ThemeToggle({ ...divProps }: ComponentPropsWithRef<"div">) {
  const { resolvedTheme, setTheme, theme } = useTheme()

  return (
    <div {...divProps}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size="icon" variant="outline" />}
          suppressHydrationWarning
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem
            checked={Boolean(theme && theme === "light")}
            disabled={Boolean(theme && theme === "light")}
            onCheckedChange={(val) => {
              if (val) {
                setTheme("light")
              }
            }}
          >
            Light
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={Boolean(theme && theme === "dark")}
            disabled={Boolean(theme && theme === "dark")}
            onCheckedChange={(val) => {
              if (val) {
                setTheme("dark")
              }
            }}
          >
            Dark
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={Boolean(theme && theme === "system")}
            disabled={Boolean(theme && theme === "system")}
            onCheckedChange={(val) => {
              if (val) {
                setTheme("system")
              }
            }}
          >
            System
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
