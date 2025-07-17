// LCP (Largest Contentful Paint) is the most important metric for static images, as it measures when the main image is rendered.
export default function StaticImagePage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Static Image Test</h1>
      <img src="/globe.svg" alt="Static Globe" width={300} height={300} />
      <p>This page displays a static image to measure FCP, LCP, and TTI.</p>
    </main>
  );
}
