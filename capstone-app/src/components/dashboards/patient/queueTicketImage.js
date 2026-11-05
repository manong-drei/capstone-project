const layoutWidth = 720;
const padding = 40;
const contentWidth = layoutWidth - 2 * padding;
const detailsX = 300;
const textWidth = layoutWidth - detailsX - padding;
const ink = "#0f172a";
const muted = "#64748b";
const bodyFont = "500 16px Arial, sans-serif";
const footerFont = "14px Arial, sans-serif";

function wrapText(context, value, maxWidth = textWidth) {
  const lines = [];
  let line = "";
  for (const word of value.trim().split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  return [...lines, line];
}

export default function createQueueTicketImage({ number, type, status, details, notice }) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Ticket image rendering is unavailable.");

  const priority = type === "Priority";
  const accent = priority ? "#c2410c" : "#1d4ed8";
  const tint = priority ? "#fff7ed" : "#eff6ff";
  context.font = bodyFont;
  const rows = details.map(([label, value]) => ({ label, lines: wrapText(context, value) }));
  context.font = footerFont;
  const instructions = wrapText(context, `${notice} Check your live ticket for updates.`, contentWidth - 32);
  const detailsTop = 124;
  const lineHeight = 22;
  const footerTop = Math.max(384, detailsTop + rows.reduce((height, row) => height + 38 + row.lines.length * lineHeight, 0) + 4);
  const footerHeight = 52 + instructions.length * 20;
  // Grow long tickets in both dimensions while preserving an exact 4:3 ratio.
  const height = Math.ceil(Math.max(540, footerTop + footerHeight + 40) / 3) * 3;
  const width = height * 4 / 3;

  canvas.width = width * 2;
  canvas.height = height * 2;
  context.scale(2, 2);
  context.textBaseline = "top";

  const text = (value, y, font, color = ink, x = padding, maxWidth = textWidth) => {
    context.fillStyle = color;
    context.font = font;
    context.fillText(value, x, y, maxWidth);
  };
  const roundedRect = (x, y, w, h, radius, color) => {
    context.beginPath();
    context.roundRect(x, y, w, h, radius);
    context.fillStyle = color;
    context.fill();
  };

  context.fillStyle = "#f1f5f9";
  context.fillRect(0, 0, width, height);
  context.shadowColor = "rgba(15, 23, 42, 0.08)";
  context.shadowBlur = 14;
  context.shadowOffsetY = 4;
  roundedRect(12, 12, width - 24, height - 24, 24, "#ffffff");
  context.shadowColor = "transparent";
  context.translate((width - layoutWidth) / 2, 0);
  roundedRect(padding, 34, 32, 32, 10, accent);
  context.fillStyle = "#ffffff";
  context.fillRect(padding + 14, 42, 4, 16);
  context.fillRect(padding + 8, 48, 16, 4);
  text("E-KALUSUGAN", 33, "bold 18px Arial, sans-serif", ink, padding + 44);
  text("City Health Office of Bago", 56, "12px Arial, sans-serif", muted, padding + 44);

  roundedRect(padding, 112, 232, 244, 22, tint);
  context.textAlign = "center";
  const numberCenter = padding + 116;
  text("DENTAL QUEUE TICKET", 138, "bold 11px Arial, sans-serif", muted, numberCenter, 200);
  text(number, 176, "bold 64px Arial, sans-serif", accent, numberCenter, 200);
  roundedRect(numberCenter - 46, 260, 92, 26, 13, "#ffffff");
  text(type.toUpperCase(), 267, "bold 11px Arial, sans-serif", accent, numberCenter);
  text(status, 316, "bold 12px Arial, sans-serif", accent, numberCenter, 200);
  context.textAlign = "left";

  let y = detailsTop;
  for (const { label, lines } of rows) {
    text(label.toUpperCase(), y, "bold 10px Arial, sans-serif", muted, detailsX);
    y += 18;
    for (const line of lines) {
      text(line, y, bodyFont, ink, detailsX);
      y += lineHeight;
    }
    y += 20;
  }

  roundedRect(padding, footerTop, contentWidth, footerHeight, 16, "#f8fafc");
  text("KEEP THIS TICKET", footerTop + 16, "bold 10px Arial, sans-serif", muted, padding + 16);
  instructions.forEach((line, index) => text(line, footerTop + 36 + index * 20, footerFont, muted, padding + 16, contentWidth - 32));

  return canvas.toDataURL("image/png");
}
