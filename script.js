:root {
  --cal-blue: #003262;
  --cal-blue-light: #2f5d8a;
  --cal-gold: #FDB515;
  --paper: #F5F1E6;
  --paper-raised: #FBF8F1;
  --ink: #232019;
  --ink-soft: #5b564a;
  --moss: #5C6B4E;
  --amber: #A98F5A;
  --line: #DCD4C0;
  --line-strong: #b9ae90;
 
  --font-serif: "Source Serif 4", Georgia, serif;
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
 
  --radius-card: 3px;
}
 
* { box-sizing: border-box; }
 
html { scroll-behavior: smooth; }
 
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-sans);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
 
.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
 
a { color: var(--cal-blue); }
 
:focus-visible {
  outline: 2px solid var(--cal-blue);
  outline-offset: 2px;
}
 
/* ---------------------------------------------
   Header
--------------------------------------------- */
.site-header {
  background: var(--cal-blue);
  color: var(--paper);
  border-bottom: 4px solid var(--cal-gold);
}
 
.header-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 2.25rem 1.5rem 1.75rem;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
}
 
.header-title h1 {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: clamp(1.6rem, 2.6vw, 2.35rem);
  margin: 0 0 0.4rem;
  letter-spacing: 0.01em;
}
 
.tagline {
  margin: 0;
  max-width: 46ch;
  color: #cfe0f2;
  font-size: 0.95rem;
}
 
.search-wrap { flex: 0 1 320px; min-width: 220px; }
 
#search {
  width: 100%;
  padding: 0.65rem 0.9rem;
  border: 1px solid transparent;
  border-radius: 2px;
  font-family: var(--font-sans);
  font-size: 0.95rem;
  background: var(--paper-raised);
  color: var(--ink);
}
 
#search::placeholder { color: var(--ink-soft); }
 
#search:focus-visible {
  outline: 2px solid var(--cal-gold);
  outline-offset: 1px;
}
 
/* ---------------------------------------------
   Layout
--------------------------------------------- */
.layout {
  max-width: 1180px;
  margin: 0 auto;
  padding: 1.75rem 1.5rem 3rem;
  display: grid;
  grid-template-columns: 232px 1fr;
  gap: 2rem;
  align-items: start;
}
 
.filter-toggle { display: none; }
 
/* ---------------------------------------------
   Disclaimer banner
--------------------------------------------- */
.disclaimer-banner {
  grid-column: 1 / -1;
  background: #FDF3DA;
  border: 1px solid #E8C766;
  border-left: 4px solid var(--cal-gold);
  border-radius: var(--radius-card);
  padding: 0.85rem 1.1rem;
  margin-bottom: 0.25rem;
}
 
.disclaimer-banner p {
  margin: 0;
  font-size: 0.86rem;
  color: #5c4a12;
  line-height: 1.55;
  max-width: 90ch;
}