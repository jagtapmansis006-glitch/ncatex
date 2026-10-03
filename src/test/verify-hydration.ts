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

  const circuitRes = await fetch("http://localhost:8081/assets/circuit-hero.mp4");
  console.log("Circuit Hero MP4 Status (must be 200 or 302):", circuitRes.status);

  const logoRes = await fetch("http://localhost:8081/assets/ncatex-logo.png");
  console.log("NCATEX Logo PNG Status (must be 200 or 302):", logoRes.status);
}

verify().catch(console.error);
