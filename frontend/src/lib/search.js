function blockStrings(block) {
  switch (block.type) {
    case "text":
      return [block.heading ?? "", block.body];
    case "steps":
      return [block.heading ?? "", ...block.steps];
    case "image":
      return [block.alt, block.caption ?? ""];
    case "video":
      return [block.title];
    case "link":
      return [block.label, block.description ?? ""];
    case "wifi":
      return ["wifi wi-fi internet password network", block.network, block.note ?? ""];
    case "contact":
      return [block.heading ?? "", ...block.methods.flatMap((m) => [m.label, m.detail ?? "", m.value])];
    case "map-link":
      return [block.label, block.note ?? ""];
    case "list":
      return [block.heading ?? "", ...block.items.flatMap((i) => [i.title, i.detail ?? ""])];
  }
}
function pageStrings(page, content) {
  const extra = [];
  if (page.type === "host") extra.push(content.host.name, content.host.bio);
  if (page.type === "places") extra.push(...content.places.flatMap((p) => [p.name, p.category, p.note]));
  return [page.title, ...extra, ...page.blocks.flatMap(blockStrings)].filter(Boolean);
}
function makeSnippet(text, term) {
  const i = text.toLowerCase().indexOf(term);
  if (text.length <= 110) return text;
  const start = Math.max(0, i - 40);
  const end = Math.min(text.length, start + 110);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}
/** Every term must appear somewhere on the page; the snippet comes from the best line. */
export function searchGuide(content, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const results = [];
  for (const page of content.pages) {
    const strings = pageStrings(page, content);
    const haystack = strings.join(" ").toLowerCase();
    if (!terms.every((t) => haystack.includes(t))) continue;
    const best =
      strings.find((s) => terms.every((t) => s.toLowerCase().includes(t))) ??
      strings.find((s) => s.toLowerCase().includes(terms[0])) ??
      strings[0];
    const titleHit = page.title.toLowerCase().includes(terms[0]);
    results.push({
      pageId: page.id,
      pageTitle: page.title,
      icon: page.icon,
      snippet: titleHit && best === page.title ? (strings[1] ?? "") : makeSnippet(best, terms[0]),
    });
  }
  // Title matches first.
  return results.sort(
    (a, b) =>
      Number(b.pageTitle.toLowerCase().includes(terms[0])) -
      Number(a.pageTitle.toLowerCase().includes(terms[0])),
  );
}
