import type { Config } from "tailwindcss"
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E8C96A",
          dark: "#A07830"
        },
        surface: "#111111",
        border: "rgba(201,168,76,0.2)"
      },
      fontFamily: {
        sans: ["Inter","system-ui","sans-serif"],
        display: ["Inter Tight","Inter","sans-serif"]
      }
    }
  },
  plugins: []
}
export default config