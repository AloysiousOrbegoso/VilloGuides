import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { plural } from "../../lib/format";
import { useData } from "../../lib/useData";
import { Button } from "../ui/Button";
import { SearchInput } from "../ui/Field";
import { Loading, ErrorNote } from "../ui/Loading";
import { DashboardBody, DirectoryTable } from "../sections/dashboard/DashboardParts";

/** Search every published guide, then open one to share it. */
export default function Directory({ me }) {
  const guides = useData(() => api.listDashboardGuides(me.client.subdomain), [me.client.subdomain]);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const all = guides.data || [];
    if (!t) return all;
    return all.filter((g) => [g.property_name, g.city, g.owner_name, g.slug].some((v) => (v || "").toLowerCase().includes(t)));
  }, [guides.data, q]);

  return (
    <DashboardBody>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-semibold m-0">Guides</h1>
          <p className="text-muted mt-1 mb-0">{guides.data ? plural(guides.data.length, "published guide") : "Loading"}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <SearchInput value={q} onChange={setQ} placeholder="Search property, owner, city, or address" className="flex-1 sm:w-72" />
          {me.user.role === "admin" && (
            <Button icon="plus" onClick={() => navigate("/requests/new-property")}>
              Add a property
            </Button>
          )}
        </div>
      </div>
      {guides.loading ? (
        <Loading />
      ) : guides.error ? (
        <ErrorNote error={guides.error} onRetry={guides.reload} />
      ) : (
        <DirectoryTable rows={rows} clientName={me.client.name} onOpen={(g) => navigate(`/guides/${g.id}`)} />
      )}
    </DashboardBody>
  );
}
