import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { shortDate } from "../../lib/format";
import { guideUrl } from "../../lib/hostname";
import { useData } from "../../lib/useData";
import { Button } from "../ui/Button";
import { Loading, ErrorNote } from "../ui/Loading";
import { StudioPhone } from "../sections/studio/editor/PreviewPanel";
import { GuideRoot } from "../shell/GuideRoot";
import { DashboardBody, NotesPanel, ShareKit } from "../sections/dashboard/DashboardParts";

/** One guide: exactly what a guest sees, plus the share kit and internal notes. */
export default function GuideDetail({ me }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const guide = useData(() => api.getDashboardGuide(me.client.subdomain, id), [id]);

  if (guide.loading) return <Loading />;
  if (guide.error) return <ErrorNote error={guide.error} onRetry={guide.reload} />;

  const g = guide.data;
  const meta = { id: g.id, slug: g.slug, property_name: g.content.property.name };

  return (
    <DashboardBody>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <button type="button" className="text-sm text-muted hover:text-ink mb-1" onClick={() => navigate("/")}>
            Back to guides
          </button>
          <h1 className="text-2xl font-semibold m-0">{g.content.property.name}</h1>
          <p className="text-muted mt-1 mb-0">
            {[g.city, g.owner_name].filter(Boolean).join(", ")}
            {g.published_at ? `, published ${shortDate(g.published_at)}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button icon="message-2" onClick={() => navigate(`/requests/change/${g.id}`)}>
            Request a change
          </Button>
          {me.user.role === "admin" && (
            <Button variant="danger" icon="trash" onClick={() => navigate(`/requests/removal/${g.id}`)}>
              Request removal
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="flex flex-col gap-6">
          <ShareKit guide={meta} clientName={g.client_name} />
          <NotesPanel guideId={g.id} author={me.user.email} />
        </div>
        <div>
          <p className="text-sm text-muted mt-0 mb-3">What guests see</p>
          <StudioPhone>
            <GuideRoot content={g.content} layout="mobile" embedded switcher={false} managedBy={g.client_name} />
          </StudioPhone>
          <p className="text-center mt-3 mb-0">
            <a href={guideUrl(g.slug)} target="_blank" rel="noreferrer" className="text-link text-sm font-semibold">
              Open in a new tab
            </a>
          </p>
        </div>
      </div>
    </DashboardBody>
  );
}
