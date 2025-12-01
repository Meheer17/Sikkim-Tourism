import React, { createContext, useContext } from "react";

const FakeTheme = {
  colors: {
    primary: "#2a6fdb",
    background: "#ffffff",
    card: "#ffffff",
    text: "#000000",
    border: "#d0d0d0",
    notification: "#ff453a",
  },
};

const ThemeContext = createContext(FakeTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={FakeTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
