import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { resolveLocation } from "./lib/hostname";
import { api, setDevHost } from "./lib/api";
import { registerServiceWorkerIfGuide } from "./lib/registerServiceWorker";
import { ToastProvider } from "./components/ui/Toast";
import { Loading } from "./components/ui/Loading";
import ComingSoon from "./components/pages/ComingSoon";

/*
  Picks the area from the hostname (production) or the path prefix (development),
  then hands off to that area's router. Areas are code-split so guests loading a
  guide never download the studio.
*/

const BrandArea = lazy(() => import("./components/pages/BrandApp"));
const StudioArea = lazy(() => import("./components/studio-pages/StudioApp"));
const DashboardArea = lazy(() => import("./components/dashboard-pages/DashboardApp"));
const IntakeForm = lazy(() => import("./components/pages/IntakeForm"));
const GuideView = lazy(() => import("./components/pages/GuideView"));
const Demo = lazy(() => import("./components/pages/Demo"));

export default function App() {
  const [loc] = useState(() => resolveLocation());
  const [tenant, setTenant] = useState(null);

  // A bare subdomain in production is either a client dashboard or a guide
  // (architecture 4.1); a white-label custom domain (architecture 11.3) is
  // the same ambiguity, just resolved from the real Host header instead of
  // an explicit sub, since liveApi.resolveHost ignores its argument and
  // always asks the Worker to resolve whatever hostname the request
  // actually arrived on.
  useEffect(() => {
    if (loc.area !== "tenant" && loc.area !== "custom") return;
    api.resolveHost(loc.sub).then((r) => setTenant(r), () => setTenant({ kind: "none" }));
  }, [loc]);

  useEffect(() => {
    if (loc.area === "dashboard") setDevHost(`${loc.client}`);
    if (loc.area === "guide") setDevHost(`${loc.slug}`);
    if (loc.area === "studio") setDevHost("studio");
    if (loc.area === "forms") setDevHost("forms");
  }, [loc]);

  // Computed before any early return, so every hook below always runs in the
  // same order regardless of how far tenant resolution has gotten. "none"
  // covers both "still waiting on resolveHost" and "resolved, no such
  // tenant"; the two are told apart just below, after the hooks. tenant.sub
  // and tenant.slug are only ever present for a custom domain (the Worker
  // resolved them from the real Host header); for an ordinary *.villoguides.com
  // subdomain, loc.sub already is the right value.
  let area = loc.area;
  let client = loc.client;
  let slug = loc.slug;
  if (area === "tenant" || area === "custom") {
    if (tenant?.kind === "client") {
      area = "dashboard";
      client = tenant.subdomain || loc.sub;
    } else if (tenant?.kind === "guide") {
      area = "guide";
      slug = tenant.slug || loc.sub;
    } else {
      area = "none";
    }
  }

  useEffect(() => {
    registerServiceWorkerIfGuide(area);
  }, [area]);

  if ((loc.area === "tenant" || loc.area === "custom") && !tenant) return <Loading full />;
  if (area === "none") return <ComingSoon variant="notfound" />;

  return (
    <ToastProvider>
      <BrowserRouter basename={loc.basename}>
        <Suspense fallback={<Loading full />}>
          {area === "brand" && <BrandArea />}
          {area === "studio" && <StudioArea />}
          {area === "dashboard" && <DashboardArea client={client} />}
          {area === "forms" && <IntakeForm token={loc.token} />}
          {area === "guide" && <GuideView slug={slug} />}
          {area === "demo" && <Demo />}
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}
