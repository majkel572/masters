// TTI (Time to Interactive) is the most important metric for forms, as it measures when the form is usable and validation works.
"use client";
import { useState } from "react";
export default function FormValidationPage() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) setError("Field is required");
    else setError("");
  };
  return (
    <main style={{ padding: 32 }}>
      <h1>Form Validation Test</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type something..."
        />
        <button type="submit">Submit</button>
      </form>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <p>
        This page displays a form with validation to measure FCP, LCP, and TTI.
      </p>
    </main>
  );
}
