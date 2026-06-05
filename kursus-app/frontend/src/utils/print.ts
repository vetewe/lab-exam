// Cetak dokumen profesional ke PDF via iframe tersembunyi.
// Pendekatan ini tidak "memotret" UI aplikasi — ia merender dokumen HTML
// mandiri dengan kop surat, tabel berbingkai, dan footer, lalu memanggil print().

const BRAND_NAVY = "#0f1f5c";
const BRAND_BLUE = "#1d9bf0";

// Escape teks agar aman dimasukkan ke HTML.
export function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string
  );
}

function tanggalCetak(): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());
}

interface PrintOptions {
  title: string;
  subtitle?: string;
  bodyHtml: string;
}

export function printDocument({ title, subtitle = "", bodyHtml }: PrintOptions) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);

  const cw = iframe.contentWindow;
  if (!cw) {
    iframe.remove();
    return;
  }

  const cleanup = () => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  };
  cw.addEventListener("afterprint", cleanup);

  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #1e293b; font-size: 12px; line-height: 1.5; }
  .kop { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid ${BRAND_NAVY}; padding-bottom: 14px; margin-bottom: 18px; }
  .kop img { width: 52px; height: 52px; }
  .kop .brand { font-size: 24px; font-weight: 800; color: ${BRAND_NAVY}; letter-spacing: 2px; line-height: 1; }
  .kop .tag { font-size: 11px; color: ${BRAND_BLUE}; font-weight: 600; margin-top: 3px; }
  .kop .right { margin-left: auto; text-align: right; font-size: 10px; color: #64748b; }
  h1.doc-title { font-size: 17px; color: ${BRAND_NAVY}; margin-bottom: 2px; }
  .periode { font-size: 12px; color: #475569; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  thead th { background: ${BRAND_NAVY}; color: #fff; text-align: left; padding: 8px 10px; font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .muted { color: #64748b; }
  .ident { background: #f1f5f9; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; }
  .ident .nama { font-size: 15px; font-weight: 700; color: ${BRAND_NAVY}; }
  .ident p { font-size: 11px; color: #475569; }
  .section-title { font-size: 13px; font-weight: 700; color: ${BRAND_NAVY}; margin: 16px 0 8px; }
  .summary { width: 60%; margin-left: auto; }
  .summary td { padding: 5px 10px; }
  .summary .label { color: #475569; }
  .summary .val { text-align: right; font-weight: 600; }
  .summary .grand td { border-top: 2px solid ${BRAND_NAVY}; font-size: 13px; color: ${BRAND_NAVY}; }
  .cards { display: flex; gap: 12px; margin-bottom: 16px; }
  .card { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
  .card .lbl { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }
  .card .num { font-size: 16px; font-weight: 700; color: ${BRAND_NAVY}; margin-top: 4px; }
  footer { margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
  @page { margin: 1.6cm; }
</style>
</head>
<body>
  <header class="kop">
    <img src="/logo.svg" alt="BOOTS" />
    <div>
      <div class="brand">BOOTS</div>
      <div class="tag">Reinforce Your Knowledge</div>
    </div>
    <div class="right">
      Dicetak pada<br /><strong>${esc(tanggalCetak())}</strong>
    </div>
  </header>

  <h1 class="doc-title">${esc(title)}</h1>
  ${subtitle ? `<p class="periode">${esc(subtitle)}</p>` : ""}

  <main>${bodyHtml}</main>

  <footer>
    <span>BOOTS — Sistem Manajemen Kursus</span>
    <span>Dokumen ini dihasilkan otomatis oleh sistem.</span>
  </footer>
</body>
</html>`;

  cw.document.open();
  cw.document.write(html);
  cw.document.close();

  // Tunggu konten (termasuk logo) termuat sebelum print.
  const doPrint = () => {
    cw.focus();
    cw.print();
  };
  if (cw.document.readyState === "complete") {
    setTimeout(doPrint, 350);
  } else {
    iframe.onload = () => setTimeout(doPrint, 350);
  }

  // Fallback bila afterprint tidak terpicu.
  setTimeout(cleanup, 60_000);
}
