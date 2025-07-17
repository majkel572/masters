// LCP (Largest Contentful Paint) is the most important metric for backend data fetching, as it measures when the fetched content is rendered.
export default async function FetchBackendPage() {
  // Using a public API for demonstration
  const res = await fetch("https://jsonplaceholder.typicode.com/posts/1");
  const data = await res.json();
  return (
    <main style={{ padding: 32 }}>
      <h1>Fetch Backend Test</h1>
      <h2>{data.title}</h2>
      <p>{data.body}</p>
      <p>This page fetches data from a backend to measure FCP, LCP, and TTI.</p>
    </main>
  );
}
