import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { newPage } from "../../lib/guideSchema";
import { guideUrl } from "../../lib/hostname";
import { copyText } from "../../lib/clipboard";
import { useData } from "../../lib/useData";
import { Button, IconButton } from "../ui/Button";
import { Icon } from "../ui/icons";
import { Loading, ErrorNote } from "../ui/Loading";
import { Menu } from "../ui/Menu";
import { GuideStatus } from "../ui/Pill";
import { useToast } from "../ui/Toast";
import { HeaderBar } from "../sections/studio/HeaderBar";
import { useStudio } from "../sections/studio/StudioLayout";
import { PageList } from "../sections/studio/editor/PageList";
import { PageEditor } from "../sections/studio/editor/PageEditor";
import { PropertyEditor, HostEditor, ThemeEditor, SubdomainEditor } from "../sections/studio/editor/DetailEditors";
import { PreviewPanel } from "../sections/studio/editor/PreviewPanel";
import { PublishPanel, VersionsDialog, publishReadiness } from "./PublishPanel";

const AUTOSAVE_MS = 900;

/** The studio editor (architecture 5.2). Three columns: pages, editor, checklist and preview. */
export default function GuideEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshStats } = useStudio();
  const loaded = useData(() => api.getGuide(id), [id]);

  const [guide, setGuide] = useState(null);
  const [draft, setDraft] = useState(null);
  const [selected, setSelected] = useState({ kind: "page", id: null });
  const [saveState, setSaveState] = useState("saved");
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef();
  const dirty = useRef(false);

  useEffect(() => {
    if (!loaded.data) return;
    setGuide(loaded.data);
    setDraft(loaded.data.draft);
    setSelected((s) => (s.id ? s : { kind: "page", id: loaded.data.draft.pages[0]?.id }));
  }, [loaded.data]);

  // Autosave. The Worker keeps the draft; publishing is a separate, explicit step.
  const scheduleSave = useCallback(
    (next) => {
      dirty.current = true;
      setSaveState("saving");
      clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try {
          await api.saveDraft(id, next);
          dirty.current = false;
          setSaveState("saved");
        } catch {
          setSaveState("error");
        }
      }, AUTOSAVE_MS);
    },
    [id],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const warn = (e) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const change = useCallback(
    (next) => {
      setDraft(next);
      scheduleSave(next);
    },
    [scheduleSave],
  );

  if (loaded.loading || !draft) {
    return (
      <>
        <HeaderBar title="Guide" crumbs={[{ to: "/guides", label: "All guides" }]} />
        <Loading />
      </>
    );
  }
  if (loaded.error) {
    return (
      <>
        <HeaderBar title="Guide" crumbs={[{ to: "/guides", label: "All guides" }]} />
        <ErrorNote error={loaded.error} onRetry={loaded.reload} />
      </>
    );
  }

  const page = selected.kind === "page" ? draft.pages.find((p) => p.id === selected.id) ?? draft.pages[0] : null;
  const { ready } = publishReadiness(guide, draft);

  async function flush() {
    clearTimeout(timer.current);
    if (dirty.current) {
      await api.saveDraft(id, draft);
      dirty.current = false;
      setSaveState("saved");
    }
  }

  async function publish() {
    setBusy(true);
    try {
      await flush();
      const g = await api.publishGuide(id);
      setGuide((cur) => ({ ...cur, ...g }));
      toast("Guide published");
      refreshStats();
    } catch (e) {
      toast(e.message, "alert-circle");
    } finally {
      setBusy(false);
    }
  }

  async function runAction(fn, message) {
    setBusy(true);
    try {
      const g = await fn();
      setGuide((cur) => ({ ...cur, ...g }));
      toast(message);
      refreshStats();
    } catch (e) {
      toast(e.message, "alert-circle");
    } finally {
      setBusy(false);
    }
  }

  function setPage(next) {
    change({ ...draft, pages: draft.pages.map((p) => (p.id === next.id ? next : p)) });
  }

  function addPage() {
    const p = newPage();
    change({ ...draft, pages: [...draft.pages, p] });
    setSelected({ kind: "page", id: p.id });
  }

  function deletePage(pid) {
    const rest = draft.pages.filter((p) => p.id !== pid);
    change({ ...draft, pages: rest });
    setSelected({ kind: "page", id: rest[0]?.id });
  }

  const saveLabel = { saving: "Saving", saved: "Saved", error: "Not saved" }[saveState];

  return (
    <>
      <HeaderBar
        title={draft.property.name || "Untitled property"}
        crumbs={[{ to: "/guides", label: "All guides" }]}
        badge={<GuideStatus status={guide.status} />}
        actions={
          <>
            <span className={`flex items-center gap-1.5 text-sm mr-1 ${saveState === "error" ? "text-accent" : "text-muted"}`}>
              <Icon name={saveState === "saving" ? "loader-2" : saveState === "error" ? "alert-circle" : "cloud-check"} className={saveState === "saving" ? "animate-spin" : ""} />
              {saveLabel}
            </span>
            {guide.published_version != null && (
              <Button icon="history" onClick={() => setVersionsOpen(true)}>
                Versions
              </Button>
            )}
            <Menu
              width={240}
              trigger={({ toggle }) => <IconButton icon="dots" label="Guide options" onClick={toggle} />}
              items={[
                {
                  label: "Open the live guide",
                  icon: "external-link",
                  disabled: guide.status !== "published",
                  onClick: () => window.open(guideUrl(guide.slug), "_blank"),
                },
                {
                  label: "Copy the guide link",
                  icon: "copy",
                  disabled: !guide.slug,
                  onClick: async () => {
                    await copyText(guideUrl(guide.slug));
                    toast("Link copied");
                  },
                },
                { label: "Change the subdomain", icon: "world", onClick: () => setSelected({ kind: "subdomain" }) },
                "divider",
                {
                  label: "Take offline",
                  icon: "eye-off",
                  disabled: guide.status !== "published",
                  onClick: () => runAction(() => api.unpublishGuide(id), "Guide taken offline"),
                },
                {
                  label: "Suspend this guide",
                  icon: "ban",
                  danger: true,
                  disabled: guide.status === "suspended",
                  onClick: () => runAction(() => api.suspendGuide(id), "Guide suspended"),
                },
              ]}
            />
            <Button variant="primary" onClick={publish} disabled={!ready || busy}>
              {guide.published_version != null ? "Publish update" : "Publish"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-[252px_minmax(0,1fr)_420px] flex-1 min-h-0">
        <PageList
          draft={draft}
          selected={selected}
          onSelect={setSelected}
          onAddPage={addPage}
          onReorder={(pages) => change({ ...draft, pages })}
        />

        <section className="overflow-auto px-10 pt-10 pb-20" aria-label="Editor">
          {selected.kind === "page" && page && (
            <PageEditor
              key={page.id}
              draft={draft}
              page={page}
              onPageChange={setPage}
              onPlacesChange={(places) => change({ ...draft, places })}
              onDeletePage={() => deletePage(page.id)}
              onGoTo={setSelected}
            />
          )}
          {selected.kind === "property" && (
            <PropertyEditor
              draft={draft}
              onChange={change}
              meta={guide}
              onMetaChange={async (patch) => {
                const g = await api.updateGuideMeta(id, patch);
                setGuide((cur) => ({ ...cur, ...g }));
              }}
            />
          )}
          {selected.kind === "host" && <HostEditor draft={draft} onChange={change} />}
          {selected.kind === "theme" && <ThemeEditor draft={draft} onChange={change} />}
          {selected.kind === "subdomain" && (
            <SubdomainEditor
              guide={guide}
              onRename={async (slug) => {
                const g = await api.renameGuide(id, slug);
                setGuide((cur) => ({ ...cur, ...g }));
                const fresh = await api.getGuide(id);
                setGuide(fresh);
                toast("Subdomain saved");
              }}
            />
          )}
        </section>

        <aside className="border-l border-line px-7 pt-6 pb-10 overflow-auto" aria-label="Preview">
          <PublishPanel guide={guide} draft={draft} onGuideChange={(g) => setGuide((cur) => ({ ...cur, ...g }))} onGoTo={setSelected} />
          <PreviewPanel draft={draft} focusPageId={selected.kind === "page" ? page?.id : undefined} onThemeChange={(preset) => change({ ...draft, theme: { ...draft.theme, preset } })} />
        </aside>
      </div>

      <VersionsDialog
        open={versionsOpen}
        guide={guide}
        onClose={() => setVersionsOpen(false)}
        onRestored={async () => {
          const fresh = await api.getGuide(id);
          setGuide(fresh);
          setDraft(fresh.draft);
          toast("Version restored and published");
          navigate(`/guides/${id}`, { replace: true });
        }}
      />
    </>
  );
}
