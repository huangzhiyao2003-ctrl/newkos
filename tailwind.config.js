export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clinical: {
          ink: "#12343b",
          teal: "#0f9f9a",
          blue: "#2d8cff",
          mist: "#edf9f8",
          line: "#cfe8e5"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(18, 52, 59, 0.08)"
      }
    }
  },
  plugins: []
};
