import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { api } from "../../../lib/api";
import { copyText, downloadDataUrl } from "../../../lib/clipboard";
import { relativeDate, dateTime } from "../../../lib/format";
import { displayHost, guideUrl } from "../../../lib/hostname";
import { Button } from "../../ui/Button";
import { Avatar } from "../../ui/Pill";
import { Textarea } from "../../ui/Field";
import { BrandMark, Icon } from "../../ui/icons";
import { ThemeToggle } from "../../ui/ThemeToggle";
import { EmptyState, Table, Cell } from "../../ui/Table";
import { useToast } from "../../ui/Toast";

/*
  {client}.villoguides.com. Occasional lookups, few sections, so a top bar instead of
  a sidebar (design principle 3). Published guides only, no editing.
*/

export function TopBar({ me }) {
  const links = [
    { to: "/", label: "Guides", end: true },
    { to: "/requests", label: "Requests" },
    me.user.role === "admin" && { to: "/export", label: "Export" },
  ].filter(Boolean);

  return (
    <header className="bg-sidebar text-nav-ink">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center gap-4 sm:gap-7 overflow-x-auto">
        <div className="flex items-center gap-2.5 shrink-0">
          <BrandMark size={26} tile />
          <span className="font-semibold">{me.client.name}</span>
        </div>
        <nav className="flex items-center gap-1 shrink-0" aria-label="Dashboard">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `h-9 px-3 rounded-lg inline-flex items-center text-[13.5px] no-underline ${isActive ? "bg-white/10 text-nav-ink" : "text-nav-muted hover:text-nav-ink"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1 min-w-4" />
        <span className="text-sm text-nav-muted hidden lg:inline truncate max-w-[220px]" title={me.user.email}>
          {me.user.email}
        </span>
        <span className="text-xs text-nav-muted border border-white/15 rounded-full px-2 py-0.5 shrink-0">{me.user.role === "admin" ? "Admin" : "Support"}</span>
        <ThemeToggle onDark />
      </div>
    </header>
  );
}

export function DashboardBody({ children, narrow = false }) {
  return <main className={`mx-auto px-5 sm:px-6 py-8 ${narrow ? "max-w-3xl" : "max-w-6xl"}`}>{children}</main>;
}

export function DirectoryTable({ rows, onOpen, clientName }) {
  const toast = useToast();
  return (
    <Table
      rows={rows}
      onRowClick={onOpen}
      empty={<EmptyState icon="notebook" title="No guides yet">Published guides appear here. Ask us to add a property when you are ready.</EmptyState>}
      columns={[
        {
          key: "p",
          label: "Property",
          render: (g) => (
            <div className="flex items-center gap-3">
              <Avatar name={g.property_name} tone="neutral" />
              <Cell title={g.property_name} detail={[g.city, g.owner_name].filter(Boolean).join(", ")} />
            </div>
          ),
        },
        { key: "a", label: "Address", width: 260, render: (g) => <span className="text-muted">{displayHost(g.slug)}</span> },
        { key: "pub", label: "Published", width: 130, render: (g) => <span className="text-muted">{relativeDate(g.published_at)}</span> },
        { key: "n", label: "Notes", width: 90, render: (g) => <span className="text-muted">{g.notes || ""}</span> },
        {
          key: "x",
          label: "",
          width: 190,
          align: "right",
          render: (g) => (
            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                icon="copy"
                onClick={async () => {
                  await copyText(shareMessage(g, clientName));
                  toast("Share message copied");
                }}
              >
                Copy message
              </Button>
              <Button size="sm" icon="external-link" href={guideUrl(g.slug)} target="_blank" rel="noreferrer">
                Open
              </Button>
            </div>
          ),
        },
      ]}
    />
  );
}

/** Ready-made message staff can paste into chat or email. */
export function shareMessage(guide, clientName) {
  return [
    `Here is the guidebook for ${guide.property_name}:`,
    guideUrl(guide.slug),
    "",
    "It has the Wi-Fi password, check-in steps, house rules, and places nearby. No app or login needed.",
    clientName ? `\n${clientName}` : "",
  ].join("\n");
}

/** QR code, share message, and a printable sign for the door. */
export function ShareKit({ guide, clientName }) {
  const toast = useToast();
  const canvasWrap = useRef(null);
  const url = guideUrl(guide.slug);

  function download() {
    const canvas = canvasWrap.current?.querySelector("canvas");
    if (!canvas) return;
    downloadDataUrl(canvas.toDataURL("image/png"), `${guide.slug}-qr.png`);
  }

  return (
    <section className="bg-card border border-line rounded-xl p-6">
      <h2 className="text-md font-semibold mt-0 mb-5">Share this guide</h2>
      <div className="flex gap-6 flex-wrap">
        <div ref={canvasWrap} className="bg-white p-3 rounded-lg border border-line shrink-0">
          <QRCodeCanvas value={url} size={132} level="M" marginSize={0} />
        </div>
        <div className="flex-1 min-w-56 flex flex-col gap-3">
          <div>
            <p className="text-sm text-muted m-0 mb-1">Guide link</p>
            <p className="m-0 break-all select-all">{displayHost(guide.slug)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              icon="link"
              onClick={async () => {
                await copyText(url);
                toast("Link copied");
              }}
            >
              Copy link
            </Button>
            <Button
              size="sm"
              icon="message"
              onClick={async () => {
                await copyText(shareMessage(guide, clientName));
                toast("Share message copied");
              }}
            >
              Copy message
            </Button>
            <Button size="sm" icon="download" onClick={download}>
              Download QR
            </Button>
            <Button size="sm" icon="printer" onClick={() => window.print()}>
              Print sign
            </Button>
          </div>
          <p className="text-sm text-muted m-0">The QR code keeps working even if the address is ever changed.</p>
        </div>
      </div>
      <PrintSign guide={guide} url={url} />
    </section>
  );
}

/** Hidden on screen, laid out for A4 when printed (see the print rules in index.css). */
function PrintSign({ guide, url }) {
  return (
    <div className="print-sign hidden print:block text-center bg-white text-black px-16 py-20">
      <h1 className="font-serif font-medium text-5xl m-0 mb-3">Welcome to {guide.property_name}</h1>
      <p className="text-xl m-0 mb-10">Scan for Wi-Fi, check-in, and everything else about the house.</p>
      <div className="inline-block">
        <QRCodeCanvas value={url} size={320} level="M" marginSize={0} />
      </div>
      <p className="text-lg mt-8 m-0">{displayHost(guide.slug)}</p>
    </div>
  );
}

/** Internal notes, never shown to guests. */
export function NotesPanel({ guideId, author }) {
  const [notes, setNotes] = useState(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listNotes(guideId).then(setNotes);
  }, [guideId]);

  async function add() {
    setBusy(true);
    try {
      const n = await api.addNote(guideId, body, author);
      setNotes((list) => [n, ...list]);
      setBody("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-card border border-line rounded-xl p-6">
      <h2 className="text-md font-semibold mt-0 mb-1">Internal notes</h2>
      <p className="text-sm text-muted mt-0 mb-4">Only your team can see these. Guests never do.</p>
      <Textarea value={body} minRows={2} onChange={(e) => setBody(e.target.value)} placeholder="Something your team should know about this property" aria-label="New note" />
      <div className="mt-3">
        <Button size="sm" onClick={add} disabled={!body.trim() || busy}>
          Add note
        </Button>
      </div>
      <ul className="list-none m-0 p-0 mt-5">
        {(notes ?? []).map((n) => (
          <li key={n.id} className="py-3 border-t border-line-soft">
            <p className="m-0 whitespace-pre-wrap">{n.body}</p>
            <p className="m-0 mt-1 text-sm text-muted">
              {n.author}, <span title={dateTime(n.created_at)}>{relativeDate(n.created_at)}</span>
            </p>
          </li>
        ))}
        {notes && notes.length === 0 && (
          <li className="py-3 border-t border-line-soft text-sm text-muted flex items-center gap-2">
            <Icon name="note" />
            No notes yet.
          </li>
        )}
      </ul>
    </section>
  );
}
