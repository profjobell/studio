
"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react" // Added Palette icon for custom themes
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator, // Added Separator
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuSeparator /> 
        <DropdownMenuItem onClick={() => setTheme("olive")}>
          <Palette className="mr-2 h-4 w-4 text-green-700" /> Olive Swathe
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("beige-brown")}>
          <Palette className="mr-2 h-4 w-4 text-yellow-700" /> Beige & Brown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("sunrise")}>
          <Palette className="mr-2 h-4 w-4 text-orange-500" /> Sunrise Vibrant
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
