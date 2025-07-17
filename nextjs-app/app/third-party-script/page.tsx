// TTI (Time to Interactive) is the most important metric for third-party scripts, as it measures when the page is usable after the script loads.
"use client";
import { useEffect } from "react";
export default function ThirdPartyScriptPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  return (
    <main style={{ padding: 32 }}>
      <h1>Third-party Script Test</h1>
      <blockquote className="twitter-tweet">
        <a href="https://twitter.com/Twitter/status/1456342957031704579">
          Loading Twitter Widget...
        </a>
      </blockquote>
      <p>This page loads a third-party script to measure FCP, LCP, and TTI.</p>
    </main>
  );
}
