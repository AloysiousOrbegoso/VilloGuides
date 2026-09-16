import { Route, Routes } from "react-router-dom";
import { api } from "../../lib/api";
import { useColorMode } from "../../lib/theme";
import { useData } from "../../lib/useData";
import { Loading, ErrorNote } from "../ui/Loading";
import { DashboardBody, TopBar } from "../sections/dashboard/DashboardParts";
import { EmptyState, Panel } from "../ui/Table";
import Directory from "./Directory";
import GuideDetail from "./GuideDetail";
import RequestChange, { RequestList } from "./RequestChange";
import Export from "./Export";
import { useEffect } from "react";

/**
 * {client}.villoguides.com (architecture 5.3). Cloudflare Access already verified who
 * this is; the API returns the signed-in user, their role, and the client.
 */
export default function DashboardApp({ client }) {
  useColorMode();
  const me = useData(() => api.getDashboardMe(client), [client]);

  useEffect(() => {
    if (me.data) document.title = `${me.data.client.name}, Villo Guides`;
  }, [me.data]);

  if (me.loading) return <Loading full />;
  if (me.error) return <ErrorNote error={me.error} onRetry={me.reload} />;

  const data = me.data;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <TopBar me={data} />
      {data.eligible ? (
        <Routes>
          <Route index element={<Directory me={data} />} />
          <Route path="guides/:id" element={<GuideDetail me={data} />} />
          <Route path="requests" element={<RequestList me={data} />} />
          <Route path="requests/:type/:guideId?" element={<RequestChange me={data} />} />
          <Route path="export" element={data.user.role === "admin" ? <Export me={data} /> : <Directory me={data} />} />
          <Route path="*" element={<Directory me={data} />} />
        </Routes>
      ) : (
        <DashboardBody narrow>
          <Panel>
            <EmptyState icon="lock" title="Your dashboard is not open yet">
              A dashboard is included once you have two paid guides, or as a one-time add-on for a single property. In the meantime we send links and QR codes
              directly.
            </EmptyState>
          </Panel>
        </DashboardBody>
      )}
    </div>
  );
}
