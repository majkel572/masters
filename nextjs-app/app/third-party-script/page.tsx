"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    FB?: any;
  }
}

export default function FacebookEmbedPage() {
  useEffect(() => {
    // Create the Facebook SDK script
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src =
      "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0";

    document.body.appendChild(script);

    script.onload = () => {
      // Re-parse Facebook plugin elements once script is loaded
      if (window.FB) {
        window.FB.XFBML.parse();
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <main style={{ padding: 32 }}>
      <h1>Facebook Post Embed</h1>
      <div
        className="fb-post"
        data-href="https://www.facebook.com/zuck/posts/10102577175875681"
        data-width="500"
      ></div>
      <p>This page embeds a Facebook post using the FB SDK.</p>
    </main>
  );
}
