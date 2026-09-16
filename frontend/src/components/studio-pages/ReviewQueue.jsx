import { useState } from "react";
import { api } from "../../lib/api";
import { useData } from "../../lib/useData";
import { Button } from "../ui/Button";
import { Loading, ErrorNote } from "../ui/Loading";
import { HeaderBar } from "../sections/studio/HeaderBar";
import { MetricCards } from "../sections/studio/MetricCards";
import { QueueTable } from "../sections/studio/QueueTable";
import { StudioBody, useStudio } from "../sections/studio/StudioLayout";
import { NewIntakeLinkDialog } from "./IntakeLinks";

export default function ReviewQueue() {
  const { stats, refreshStats } = useStudio();
  const queue = useData(() => api.getQueue(), []);
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <>
      <HeaderBar
        title="Review queue"
        actions={
          <Button variant="primary" icon="plus" onClick={() => setLinkOpen(true)}>
            New intake link
          </Button>
        }
      />
      <StudioBody>
        <MetricCards
          items={[
            { label: "Pending review", value: stats?.pending, icon: "clock", accent: true },
            { label: "Published", value: stats?.published, icon: "check" },
            { label: "Open change requests", value: stats?.openRequests, icon: "message-2" },
            { label: "Clients", value: stats?.clients, icon: "building" },
          ]}
        />
        {queue.loading ? <Loading /> : queue.error ? <ErrorNote error={queue.error} onRetry={queue.reload} /> : <QueueTable rows={queue.data} />}
      </StudioBody>
      <NewIntakeLinkDialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        onCreated={() => {
          refreshStats();
          queue.reload({ quiet: true });
        }}
      />
    </>
  );
}
