// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // Make sure this is imported
import App from "./App"; // Make sure the path is correct
import "./index.css"; // Tailwind CSS base styles
import { ThemeProvider } from "./context/ThemeContext"; // Make sure path is correct

// Get the root element safely
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error(
    "Fatal Error: Root element with ID 'root' not found in index.html. App cannot be mounted."
  );
} else {
  // Log right before rendering to ensure this part is reached
  console.log("Mounting React App within BrowserRouter and ThemeProvider...");

  ReactDOM.createRoot(rootElement).render(

      <BrowserRouter>
        {/* ThemeProvider can be inside or outside BrowserRouter, inside is fine */}
        <ThemeProvider>
          <App /> {/* App component is rendered here */}
        </ThemeProvider>
      </BrowserRouter>

  );

  console.log("React App mounting initiated."); // Check if this logs
}
