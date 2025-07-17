// TTI (Time to Interactive) is the most important metric for client-side navigation, as it measures when navigation is usable.
"use client";
import Link from "next/link";
export default function ClientNavigationPage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Client-side Navigation Test</h1>
      <Link href="/">Go to Static Text Test</Link>
      <p>
        This page demonstrates client-side navigation to measure FCP, LCP, and
        TTI.
      </p>
    </main>
  );
}
