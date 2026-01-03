import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 8px 30px rgba(0,0,0,0.35)",
      },
      borderRadius: {
        sy: "14px",
        sy2: "18px",
        sy3: "22px",
      },
    },
  },
  plugins: [],
} satisfies Config;
