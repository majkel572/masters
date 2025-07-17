// LCP (Largest Contentful Paint) is the most important metric for a complex list, as it measures when the largest visible element is rendered.
export default function ComplexListPage() {
  const items = Array.from({ length: 1000 }, (_, i) => ({
    title: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
  }));
  return (
    <main style={{ padding: 32 }}>
      <h1>Complex List Test</h1>
      <ul>
        {items.map((item) => (
          <li key={item.title} style={{ marginBottom: 12 }}>
            <strong>{item.title}</strong>
            <div>{item.description}</div>
          </li>
        ))}
      </ul>
      <p>This page displays a complex list to measure FCP, LCP, and TTI.</p>
    </main>
  );
}
