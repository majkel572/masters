// LCP (Largest Contentful Paint) is the most important metric for video, as it measures when the video is rendered and ready to play.
export default function VideoPage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Video Test</h1>
      <video width="320" height="240" controls>
        <source
          src="https://www.w3schools.com/html/mov_bbb.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
      <p>This page displays a video to measure FCP, LCP, and TTI.</p>
    </main>
  );
}
