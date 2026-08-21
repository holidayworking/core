// Source: https://code.usecue.com/mosaic/ (https://code.usecue.com/demos/mosaic/mosaic.js)
// License: WTFPL

type RowItem = { img: HTMLImageElement; ratio: number };
type Row = { rowItems: RowItem[]; totalRatio: number };

const debounce = <Args extends unknown[]>(fn: (...args: Args) => void, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const MARGIN_PX = 4;
const MAX_IMAGE_WIDTH_PX = 700;

const setMissingRatios = (images: NodeListOf<HTMLImageElement>) => {
  images.forEach((img) => {
    if (!img.dataset.ratio && img.naturalWidth && img.naturalHeight) {
      img.dataset.ratio = String(img.naturalWidth / img.naturalHeight);
    }
  });
};

const buildRows = (images: NodeListOf<HTMLImageElement>, containerWidth: number): Row[] => {
  const rows: Row[] = [];
  let idx = 0;

  while (idx < images.length) {
    const rowItems: RowItem[] = [];
    let totalRatio = 0;
    let maxRatio = 0;
    let rowEnd = false;

    while (!rowEnd && idx < images.length) {
      const img = images[idx];
      const ratio = parseFloat(img.dataset.ratio ?? "") || 1;
      rowItems.push({ img, ratio });
      totalRatio += ratio;
      maxRatio = Math.max(maxRatio, ratio);

      const gutters = (rowItems.length - 1) * MARGIN_PX;
      const rowHeight = (containerWidth - gutters) / totalRatio;
      // The widest image in the row determines whether the row is too wide;
      // rowHeight is shared, so it's always the image with the highest ratio.
      const tooWide = Math.round(rowHeight * maxRatio) > MAX_IMAGE_WIDTH_PX;

      if (tooWide && idx < images.length - 1) {
        idx++;
      } else {
        rowEnd = true;
      }
    }

    rows.push({ rowItems, totalRatio });
    idx++;
  }

  return rows;
};

const mergeShortLastRow = (rows: Row[], containerWidth: number, minImagesPerRow: number) => {
  while (
    rows.length > 1 &&
    rows[rows.length - 1].rowItems.length < minImagesPerRow &&
    containerWidth >= 600
  ) {
    const lastRow = rows.pop()!;
    const newLastRow = rows[rows.length - 1];
    newLastRow.rowItems.push(...lastRow.rowItems);
    newLastRow.totalRatio += lastRow.totalRatio;
  }
};

const trimOverfullLastRow = (rows: Row[], maxImagesLastRow: number) => {
  while (rows.length > 1 && rows[rows.length - 1].rowItems.length > maxImagesLastRow) {
    const lastRow = rows[rows.length - 1];
    const prevRow = rows[rows.length - 2];

    const moved = lastRow.rowItems.shift()!;
    lastRow.totalRatio -= moved.ratio;
    prevRow.rowItems.push(moved);
    prevRow.totalRatio += moved.ratio;
  }
};

const applyRowSizes = (rows: Row[], containerWidth: number) => {
  rows.forEach(({ rowItems, totalRatio }) => {
    const gutters = (rowItems.length - 1) * MARGIN_PX;
    const rowHeight = (containerWidth - gutters) / totalRatio;

    const widths = rowItems.map(({ ratio }) => Math.round(rowHeight * ratio));
    const roundedHeight = Math.round(rowHeight);

    const totalWidth = widths.reduce((a, b) => a + b, 0) + gutters;
    const diff = containerWidth - totalWidth;

    widths[widths.length - 1] += diff;

    rowItems.forEach(({ img }, i) => {
      img.style.height = `${roundedHeight}px`;
      img.style.width = `${widths[i]}px`;
      img.style.marginRight = i < rowItems.length - 1 ? `${MARGIN_PX}px` : "0";
    });
  });
};

// Reads every gallery's container width before writing any styles, so the browser
// only has to flush layout once instead of once per gallery.
const justifyGalleries = (galleries: HTMLElement[]) => {
  galleries.forEach((gallery) => gallery.style.removeProperty("width"));
  const containerWidths = galleries.map((gallery) =>
    Math.floor(gallery.getBoundingClientRect().width),
  );

  const layouts = galleries.map((gallery, i) => {
    const containerWidth = containerWidths[i];
    const images = gallery.querySelectorAll("img");
    setMissingRatios(images);

    const minImagesPerRow = Math.ceil(containerWidth / MAX_IMAGE_WIDTH_PX);
    const maxImagesLastRow = minImagesPerRow + 1;

    const rows = buildRows(images, containerWidth);
    mergeShortLastRow(rows, containerWidth, minImagesPerRow);
    trimOverfullLastRow(rows, maxImagesLastRow);

    return { gallery, containerWidth, rows };
  });

  layouts.forEach(({ gallery, containerWidth, rows }) => {
    applyRowSizes(rows, containerWidth);
    gallery.style.width = containerWidth + "px";
  });
};

const justifyGallery = (gallery: HTMLElement) => justifyGalleries([gallery]);

export const init = () => {
  const galleries = [...document.querySelectorAll<HTMLElement>("div.mosaic-gallery")];

  // Shared debounce: a resize affects every gallery at once, so batch them into one timer.
  const debouncedResizeAll = debounce(() => justifyGalleries(galleries), 50);
  window.addEventListener("resize", debouncedResizeAll);

  galleries.forEach((gallery) => {
    // Per-gallery debounce: keeps one gallery's slow image loads from delaying another's.
    const debouncedResize = debounce(() => justifyGallery(gallery), 50);

    gallery.querySelectorAll("img").forEach((img) => {
      img.addEventListener("load", debouncedResize);
    });
  });

  justifyGalleries(galleries);
};
