import { useEffect } from "react";
import { api } from "../../lib/api";
import { guideUrl, reportUrl } from "../../lib/hostname";
import { applyMode } from "../../lib/theme";
import { useData } from "../../lib/useData";
import { GuideRoot } from "../shell/GuideRoot";
import { Loading, ErrorNote } from "../ui/Loading";
import ComingSoon from "./ComingSoon";

/** {property}.villoguides.com. Public, no login, never indexed (architecture 5.5). */
export default function GuideView({ slug }) {
  const { data, loading, error, reload } = useData(() => api.getPublicGuide(slug), [slug]);

  useEffect(() => {
    applyMode("light");
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow";
  }, []);

  useEffect(() => {
    if (data?.state === "published") document.title = data.content.property.name;
    // The Worker answers renamed slugs with a 301. This covers development and cached shells.
    if (data?.state === "redirect") window.location.replace(guideUrl(data.slug));
  }, [data]);

  if (loading || data?.state === "redirect") return <Loading full />;
  if (error) return <ErrorNote error={error} onRetry={reload} />;
  if (data.state === "notfound") return <ComingSoon variant="notfound" />;
  if (data.state === "unavailable") return <ComingSoon variant="unavailable" />;
  return <GuideRoot content={data.content} page managedBy={data.managedBy} reportHref={reportUrl(slug)} />;
}
