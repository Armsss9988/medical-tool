const golabSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="300" height="100">
  <rect width="300" height="100" fill="#ffffff"/>
  <g transform="translate(10, 15)">
    <rect x="5" y="5" width="60" height="60" rx="16" fill="#0284c7" />
    <path d="M35 20 v30 M20 35 h30" stroke="#ffffff" stroke-width="7" stroke-linecap="round" />
    <circle cx="48" cy="22" r="3.5" fill="#38bdf8" />
  </g>
  <text x="85" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="900" fill="#0f172a" letter-spacing="-1">Go<tspan fill="#0284c7">Lab</tspan></text>
  <text x="86" y="68" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#64748b" letter-spacing="1">MEDICAL LABORATORY</text>
</svg>`;

const golabLogo = `data:image/svg+xml;base64,${btoa(golabSvg)}`;
export default golabLogo;
