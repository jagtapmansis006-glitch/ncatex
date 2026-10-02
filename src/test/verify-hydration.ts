async function verify() {
  const homeRes = await fetch("http://localhost:8081/");
  console.log("Home HTTP Status:", homeRes.status);
  const html = await homeRes.text();
  console.log("HTML byte length:", html.length);

  const hasNeutralPlaceholder = html.includes('aria-label="Toggle theme"');
  console.log("SSR contains neutral Theme placeholder:", hasNeutralPlaceholder);

  const hasClientSpecificTitle =
    html.includes("Switch to Light Mode") || html.includes("Switch to Dark Mode");
  console.log("SSR contains client-specific titles (must be false):", hasClientSpecificTitle);

  const webmRes = await fetch(
    "http://localhost:8081/__l5e/assets-v1/a071327a-b845-430f-8fb1-161572ce64a4/ncatex-hero-web.webm",
  );
  console.log("WebM Asset HTTP Status (must be 200 or 302):", webmRes.status);

  const localVideoRes = await fetch("http://localhost:8081/hero-video.mp4");
  console.log("Local hero-video.mp4 HTTP Status:", localVideoRes.status);
}

verify().catch(console.error);
