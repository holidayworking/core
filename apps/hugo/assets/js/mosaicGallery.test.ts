// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";

import { init } from "./mosaicGallery.ts";

const stubWidth = (element: HTMLElement, width: number) => {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    width,
    height: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
};

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("init", () => {
  it("justifies a gallery's images into a single row that fills the container width", () => {
    document.body.innerHTML = `
      <div class="mosaic-gallery">
        <img data-ratio="1">
        <img data-ratio="1">
      </div>
    `;
    const gallery = document.querySelector<HTMLElement>(".mosaic-gallery")!;
    stubWidth(gallery, 1000);

    init();

    const images = gallery.querySelectorAll("img");
    expect(gallery.style.width).toBe("1000px");
    expect(images[0].style.width).toBe("498px");
    expect(images[0].style.height).toBe("498px");
    expect(images[0].style.marginRight).toBe("4px");
    expect(images[1].style.width).toBe("498px");
    expect(images[1].style.marginRight).toBe("0px");
  });

  it("splits images into multiple rows once a row would grow too tall", () => {
    document.body.innerHTML = `
      <div class="mosaic-gallery">
        <img data-ratio="1">
        <img data-ratio="1">
        <img data-ratio="1">
        <img data-ratio="1">
      </div>
    `;
    const gallery = document.querySelector<HTMLElement>(".mosaic-gallery")!;
    stubWidth(gallery, 1000);

    init();

    const images = [...gallery.querySelectorAll("img")];
    // The [gutter, no-gutter, gutter, no-gutter] margin pattern is the proof: it only
    // occurs if the images landed on two 2-image rows rather than one row of 4.
    expect(images.map((img) => img.style.marginRight)).toEqual(["4px", "0px", "4px", "0px"]);
    expect(images.map((img) => img.style.width)).toEqual(["498px", "498px", "498px", "498px"]);
  });

  it("fills in data-ratio from the image's natural dimensions when not already set", () => {
    document.body.innerHTML = `<div class="mosaic-gallery"><img></div>`;
    const gallery = document.querySelector<HTMLElement>(".mosaic-gallery")!;
    const img = gallery.querySelector("img")!;
    Object.defineProperty(img, "naturalWidth", { value: 300, configurable: true });
    Object.defineProperty(img, "naturalHeight", { value: 150, configurable: true });
    stubWidth(gallery, 1000);

    init();

    expect(img.dataset.ratio).toBe(String(300 / 150));
  });

  it("re-justifies on window resize, after the debounce delay", () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div class="mosaic-gallery">
        <img data-ratio="1">
        <img data-ratio="1">
      </div>
    `;
    const gallery = document.querySelector<HTMLElement>(".mosaic-gallery")!;
    stubWidth(gallery, 1000);

    init();
    expect(gallery.style.width).toBe("1000px");

    stubWidth(gallery, 500);
    window.dispatchEvent(new Event("resize"));
    expect(gallery.style.width).toBe("1000px");

    vi.advanceTimersByTime(50);
    expect(gallery.style.width).toBe("500px");
  });

  it("re-justifies only the affected gallery when one of its images loads", () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div class="mosaic-gallery" id="a"><img data-ratio="1"><img data-ratio="1"></div>
      <div class="mosaic-gallery" id="b"><img data-ratio="1"><img data-ratio="1"></div>
    `;
    const galleryA = document.getElementById("a")!;
    const galleryB = document.getElementById("b")!;
    stubWidth(galleryA, 1000);
    stubWidth(galleryB, 1000);

    init();
    expect(galleryA.style.width).toBe("1000px");
    expect(galleryB.style.width).toBe("1000px");

    stubWidth(galleryA, 500);
    galleryA.querySelector("img")!.dispatchEvent(new Event("load"));
    vi.advanceTimersByTime(50);

    expect(galleryA.style.width).toBe("500px");
    expect(galleryB.style.width).toBe("1000px");
  });
});
