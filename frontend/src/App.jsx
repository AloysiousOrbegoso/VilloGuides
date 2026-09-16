import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { resolveLocation } from "./lib/hostname";
import { api, setDevHost } from "./lib/api";
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

  // A bare subdomain in production is either a client dashboard or a guide (architecture 4.1).
  useEffect(() => {
    if (loc.area !== "tenant") return;
    api.resolveHost(loc.sub).then((r) => setTenant(r.kind), () => setTenant("none"));
  }, [loc]);

  useEffect(() => {
    if (loc.area === "dashboard") setDevHost(`${loc.client}`);
    if (loc.area === "guide") setDevHost(`${loc.slug}`);
    if (loc.area === "studio") setDevHost("studio");
    if (loc.area === "forms") setDevHost("forms");
  }, [loc]);

  let area = loc.area;
  let client = loc.client;
  let slug = loc.slug;
  if (area === "tenant") {
    if (!tenant) return <Loading full />;
    if (tenant === "client") {
      area = "dashboard";
      client = loc.sub;
    } else if (tenant === "guide") {
      area = "guide";
      slug = loc.sub;
    } else {
      return <ComingSoon variant="notfound" />;
    }
  }

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
