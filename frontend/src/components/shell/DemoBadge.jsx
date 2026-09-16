import { BrandMark } from "../ui/icons";

export function DemoBadge() {
  return <span className="demo-badge">Sample guidebook</span>;
}

/**
 * Bottom of every guide. Real guides show who manages the property, a small
 * VilloGuides credit, and the report link (architecture section 5.5).
 */
export function GuideFooter({ demo = false, managedBy, reportHref }) {
  return (
    <footer className="guide-footer">
      {demo && <p>This is a sample. Real guides are built for your property.</p>}
      {!demo && managedBy && <p>Managed by {managedBy}</p>}
      <p className="guide-footer__credit">
        <BrandMark size={14} />
        Guide by Villo Guides
      </p>
      {reportHref && (
        <p>
          <a href={reportHref}>Report this guide</a>
        </p>
      )}
    </footer>
  );
}
