// FCP (First Contentful Paint) is the most important metric for a simple list, as it measures when the list is first rendered.
export default function SimpleListPage() {
  const items = Array.from({ length: 10 }, (_, i) => `Item ${i + 1}`);
  return (
    <main style={{ padding: 32 }}>
      <h1>Simple List Test</h1>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>This page displays a simple list to measure FCP, LCP, and TTI.</p>
    </main>
  );
}
