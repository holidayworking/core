import type { OverlayOptions, Sharp } from "sharp";

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
const FONT_FAMILY = "DejaVu Sans";
const BOLD_FONT_FAMILY = `${FONT_FAMILY} Bold`;

// sharp's text input is parsed as Pango markup, so EXIF strings have to be
// escaped before they are wrapped in the <span> below.
const escapeMarkup = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

type Line = {
  readonly align: "left" | "right";
  readonly bold?: boolean;
  readonly color: string;
  readonly fontSize: number;
  readonly text: string;
};

type Fonts = {
  readonly bold: string | undefined;
  readonly regular: string | undefined;
};

const renderLine = async (line: Line, maxWidth: number, fonts: Fonts) => {
  const { bold, color, fontSize, text } = line;
  const rendered = await sharp({
    text: {
      // Lambda has no system fonts: `font` selects family and size while
      // `fontfile` points Pango at the bundled DejaVu file. dpi 72 keeps the
      // font size in pixels so it scales with the ratios above.
      dpi: 72,
      font: `${bold ? BOLD_FONT_FAMILY : FONT_FAMILY} ${fontSize}`,
      fontfile: bold ? fonts.bold : fonts.regular,
      rgba: true,
      text: `<span foreground="${color}">${escapeMarkup(text)}</span>`,
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });

  const fitted =
    rendered.info.width <= maxWidth
      ? rendered
      : await sharp(rendered.data).resize({ width: maxWidth }).png().toBuffer({
          resolveWithObject: true,
        });
  return { ...fitted, line };
};

export const withWatermark = async (
  pipeline: Sharp,
  watermark: Watermark,
  size: { readonly height: number; readonly width: number },
) => {
  const { dateTime, exposure, location } = watermark;
  const { height, width } = size;
  // Sizing off the longest side keeps a photo's watermark the same whether it
  // is stored landscape or portrait, instead of shrinking with the width.
  const fontSize = Math.max(
    Math.round(Math.max(width, height) * FONT_SIZE_RATIO),
    MINIMUM_FONT_SIZE,
  );
  const secondaryFontSize = Math.max(
    Math.round(fontSize * SECONDARY_FONT_SIZE_RATIO),
    MINIMUM_FONT_SIZE,
  );
  const padding = Math.round(fontSize * PADDING_RATIO);
  const exposureLine: Line[] = exposure
    ? [{ align: "right", bold: true, color: PRIMARY_COLOR, fontSize, text: exposure }]
    : [];
  const dateTimeLine: Line[] = dateTime
    ? [{ align: "left", color: SECONDARY_COLOR, fontSize: secondaryFontSize, text: dateTime }]
    : [];
  const locationLine: Line[] = location
    ? [{ align: "right", color: SECONDARY_COLOR, fontSize: secondaryFontSize, text: location }]
    : [];
  const rows = [exposureLine, [...dateTimeLine, ...locationLine]].filter((row) => row.length > 0);
  if (rows.length === 0) {
    return pipeline;
  }

  const fonts: Fonts = {
    bold: process.env.WATERMARK_BOLD_FONT_FILE,
    regular: process.env.WATERMARK_FONT_FILE,
  };

  const rendered = await Promise.all(
    rows.map(async (row) =>
      Promise.all(
        row.map(async (line) =>
          renderLine(
            line,
            row.length > 1
              ? Math.floor((width - 3 * padding) / 2)
              : Math.max(width - 2 * padding, 1),
            fonts,
          ),
        ),
      ),
    ),
  );

  const gap = Math.round(fontSize * LINE_GAP_RATIO);
  const rowHeights = rendered.map((row) => Math.max(...row.map(({ info }) => info.height)));
  const rowsHeight = rowHeights.reduce(
    (total, rowHeight, index) => total + rowHeight + (index > 0 ? gap : 0),
    0,
  );

  const bandMargin = Math.round(fontSize * BAND_MARGIN_RATIO);
  const bandHeight = rowsHeight + 2 * bandMargin;

  const composite: OverlayOptions[] = [];
  // Composite offsets are relative to the extended canvas, so the band starts
  // at the original image height.
  let top = height + bandMargin;
  for (const [index, row] of rendered.entries()) {
    const rowHeight = rowHeights[index];
    for (const { data, info, line } of row) {
      composite.push({
        input: data,
        left: line.align === "left" ? padding : Math.max(width - padding - info.width, 0),
        top: top + Math.round((rowHeight - info.height) / 2),
      });
    }
    top += rowHeight + gap;
  }

  return pipeline.extend({ background: BAND_BACKGROUND, bottom: bandHeight }).composite(composite);
};
