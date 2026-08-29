import type { OverlayOptions } from "sharp";

import sharp from "sharp";

import type { Watermark } from "./exif.ts";

const BAND_BACKGROUND = "#ffffff";
const PRIMARY_COLOR = "#2b2b2b";
const SECONDARY_COLOR = "#6e6e6e";
const FONT_SIZE_RATIO = 0.022;
const SECONDARY_FONT_SIZE_RATIO = 0.85;
const MINIMUM_FONT_SIZE = 14;
const BAND_MARGIN_RATIO = 0.8;
const LINE_GAP_RATIO = 0.5;
const PADDING_RATIO = 1.2;
const FONT_FAMILY = "Noto Sans";
const BOLD_FONT_FAMILY = `${FONT_FAMILY} Bold`;

// The text is interpolated into Pango markup, so its reserved characters have to be escaped.
const escapeMarkup = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

type Style = {
  readonly bold?: boolean;
  readonly color: string;
  readonly fontSize: number;
};

type Line = {
  readonly align: "left" | "right";
  readonly text: string;
};

const renderLine = async (line: Line, style: Style, maxWidth: number) => {
  const { align, text } = line;
  const { bold, color, fontSize } = style;
  const rendered = await sharp({
    text: {
      dpi: 72,
      font: `${bold ? BOLD_FONT_FAMILY : FONT_FAMILY} ${fontSize}`,
      rgba: true,
      text: `<span foreground="${color}">${escapeMarkup(text)}</span>`,
    },
  })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const fitted =
    rendered.info.width <= maxWidth
      ? rendered
      : await sharp(rendered.data, { raw: rendered.info })
          .resize({ width: maxWidth })
          .raw()
          .toBuffer({ resolveWithObject: true });
  return { align, ...fitted };
};

export const toWatermarkOverlays = async (
  watermark: Watermark,
  size: { readonly height: number; readonly width: number },
): Promise<OverlayOptions[]> => {
  const { dateTime, device, exposure, location } = watermark;
  const { height, width } = size;
  const fontSize = Math.max(
    Math.round(Math.min(width, height) * FONT_SIZE_RATIO),
    MINIMUM_FONT_SIZE,
  );
  const secondaryFontSize = Math.max(
    Math.round(fontSize * SECONDARY_FONT_SIZE_RATIO),
    MINIMUM_FONT_SIZE,
  );
  const padding = Math.round(fontSize * PADDING_RATIO);
  const rows = [
    { style: { bold: true, color: PRIMARY_COLOR, fontSize }, texts: [device, exposure] },
    { style: { color: SECONDARY_COLOR, fontSize: secondaryFontSize }, texts: [dateTime, location] },
  ]
    .map(({ style, texts }) => ({
      lines: texts.flatMap((text, index): Line[] =>
        text === undefined ? [] : [{ align: index === 0 ? "left" : "right", text }],
      ),
      style,
    }))
    .filter(({ lines }) => lines.length > 0);
  if (rows.length === 0) {
    return [];
  }

  const rendered = await Promise.all(
    rows.map(async ({ lines, style }) => {
      // A two line row is split in half by padding at both edges and between the lines.
      const maxWidth = Math.max(
        lines.length > 1 ? Math.floor((width - 3 * padding) / 2) : width - 2 * padding,
        1,
      );
      const items = await Promise.all(lines.map((line) => renderLine(line, style, maxWidth)));
      return { height: Math.max(...items.map(({ info }) => info.height)), items };
    }),
  );

  const gap = Math.round(fontSize * LINE_GAP_RATIO);
  const rowsHeight =
    rendered.reduce((total, row) => total + row.height, 0) + gap * (rendered.length - 1);

  const bandMargin = Math.round(fontSize * BAND_MARGIN_RATIO);
  const bandHeight = rowsHeight + 2 * bandMargin;
  if (bandHeight >= height) {
    return [];
  }

  const bandTop = height - bandHeight;
  const overlays: OverlayOptions[] = [
    {
      input: { create: { background: BAND_BACKGROUND, channels: 3, height: bandHeight, width } },
      left: 0,
      top: bandTop,
    },
  ];
  let top = bandTop + bandMargin;
  for (const row of rendered) {
    for (const { align, data, info } of row.items) {
      overlays.push({
        input: data,
        left: align === "left" ? padding : Math.max(width - padding - info.width, 0),
        raw: info,
        top: top + Math.round((row.height - info.height) / 2),
      });
    }
    top += row.height + gap;
  }

  return overlays;
};
