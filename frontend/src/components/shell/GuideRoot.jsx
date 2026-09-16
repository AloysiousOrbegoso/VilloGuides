import { useMemo } from "react";
import { visibleContent } from "../../lib/guideSchema";
import { customThemeStyle } from "../../lib/guideThemes";
import { useViewport } from "../../lib/useViewport";
import { GuideThemeProvider, useTheme } from "./GuideThemeProvider";
import { MobileShell } from "./MobileShell";
import { DesktopShell } from "./DesktopShell";
import { GuideFooter } from "./DemoBadge";

/**
 * The one entry point for rendering a guide anywhere: the public guide, the demo,
 * the studio preview, the intake preview, and the dashboard.
 *
 * layout: "auto" picks by screen width. "mobile" or "desktop" forces one.
 * page:   true when the guide is the whole browser page (guest view).
 */
export function GuideRoot({
  content,
  layout = "auto",
  page = false,
  demo = false,
  managedBy,
  reportHref,
  focusPageId,
  embedded = false,
  switcher = true,
}) {
  const visible = useMemo(() => visibleContent(content), [content]);
  const preset = visible.theme?.preset ?? "daytime";
  return (
    <GuideThemeProvider initial={preset} syncPage={page}>
      <GuideSurface
        content={visible}
        layout={layout}
        page={page}
        demo={demo}
        managedBy={managedBy}
        reportHref={reportHref}
        focusPageId={focusPageId}
        embedded={embedded}
        switcher={switcher && preset !== "custom"}
      />
    </GuideThemeProvider>
  );
}

function GuideSurface({ content, layout, page, demo, managedBy, reportHref, focusPageId, embedded, switcher }) {
  const { theme } = useTheme();
  const { isDesktop } = useViewport();
  const desktop = layout === "desktop" || (layout === "auto" && isDesktop);
  const footer = <GuideFooter demo={demo} managedBy={managedBy} reportHref={reportHref} />;
  const focus = focusPageId && content.pages.some((p) => p.id === focusPageId) ? focusPageId : undefined;

  return (
    <div
      className={`guide ${page ? "guide--page" : "guide--contained"}`}
      data-guide-theme={content.theme?.preset === "custom" ? "custom" : theme}
      style={customThemeStyle(content.theme)}
    >
      {desktop ? (
        <DesktopShell content={content} demo={demo} footer={footer} focusPageId={focus} switcher={switcher} contained={!page} />
      ) : (
        <MobileShell
          content={content}
          embedded={embedded || !page}
          demo={demo}
          footer={footer}
          focusPageId={focus}
          switcher={switcher}
        />
      )}
    </div>
  );
}
