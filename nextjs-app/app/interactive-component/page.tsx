// TTI (Time to Interactive) is the most important metric for interactive components, as it measures when the component is usable.
"use client";
import { useState } from "react";
export default function InteractiveComponentPage() {
  const [count, setCount] = useState(0);
  return (
    <main style={{ padding: 32 }}>
      <h1>Interactive Component Test</h1>
      <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
      <p>
        This page displays an interactive button to measure FCP, LCP, and TTI.
      </p>
    </main>
  );
}
