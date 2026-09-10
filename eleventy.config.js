import { HtmlBasePlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg", "src/favicon.ico": "favicon.ico", "src/favicon-32.png": "favicon-32.png", "src/favicon-16.png": "favicon-16.png" });
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.ignores.add("src/admin/**");

  // Gör att alla länkar fungerar även när sajten ligger under /Bibelbecca/ på GitHub Pages
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addGlobalData("aret", () => new Date().getFullYear());

  eleventyConfig.addFilter("medLang", (arr, lang) => (arr || []).filter((p) => p.data.lang === lang));

  eleventyConfig.addFilter("medTyp", (arr, typ) =>
    (arr || []).filter((p) => String(p.data.typ || "").toLowerCase() === String(typ).toLowerCase())
  );

  eleventyConfig.addFilter("utanTyp", (arr, typ) =>
    (arr || []).filter((p) => String(p.data.typ || "").toLowerCase() !== String(typ).toLowerCase())
  );

  // Nyaste först; poster utan datum hamnar sist
  eleventyConfig.addFilter("nyastForst", (arr) =>
    [...(arr || [])].sort((a, b) => {
      const da = a.data.datum ? new Date(a.data.datum).getTime() : 0;
      const db = b.data.datum ? new Date(b.data.datum).getTime() : 0;
      return db - da;
    })
  );

  eleventyConfig.addFilter("sorteraOrdning", (arr) =>
    [...(arr || [])].sort((a, b) => (a.data.ordning ?? 99) - (b.data.ordning ?? 99))
  );

  eleventyConfig.addFilter("lokalFor", (locales, kod) => locales.find((l) => l.code === kod) || locales[0]);

  eleventyConfig.addFilter("bytLokal", (pageUrl, franPrefix, tillPrefix) => {
    let rest = String(pageUrl || "/").replace(/^\//, "");
    if (franPrefix && rest.startsWith(franPrefix)) rest = rest.slice(franPrefix.length);
    return "/" + tillPrefix + rest;
  });

  eleventyConfig.addFilter("nl2br", (s) =>
    String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")
  );

  eleventyConfig.addFilter("datumLokal", (d, kod) =>
    new Intl.DateTimeFormat(kod, { day: "numeric", month: "long", year: "numeric" }).format(new Date(d))
  );

  eleventyConfig.addFilter("tal", (n, kod) => Number(n || 0).toLocaleString(kod));

  eleventyConfig.addFilter("youtubeId", (url) => {
    const m = String(url || "").match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : "";
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
    },
    pathPrefix: process.env.PATH_PREFIX || "/",
  };
}
