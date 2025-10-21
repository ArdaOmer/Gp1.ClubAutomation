// src/lib/ics.ts
export function downloadIcs(opts: {
  title: string;
  description?: string;
  location?: string;
  startISO: string;
  endISO: string;
}) {
  const dt = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GP1 Club Automation//TR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `DTSTART:${dt(opts.startISO)}`,
    `DTEND:${dt(opts.endISO)}`,
    `SUMMARY:${escape(opts.title)}`,
    opts.location ? `LOCATION:${escape(opts.location)}` : "",
    opts.description ? `DESCRIPTION:${escape(opts.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${opts.title}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escape(s: string) {
  return s.replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
}
