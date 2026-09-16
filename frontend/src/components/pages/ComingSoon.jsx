import { useEffect } from "react";
import { CONTACT_EMAIL, brandUrl } from "../../lib/hostname";
import { applyMode } from "../../lib/theme";
import { Button } from "../ui/Button";
import { BrandMark, Wordmark } from "../ui/icons";

/*
  One component for "not live yet" and "not here" moments (architecture 5.7).
  Left-aligned, light grey background, line-art icon in navy with a maroon detail,
  EB Garamond heading, Open Sans body. No card, no shadow, no gradient.
*/

const VARIANTS = {
  payment: {
    art: "map",
    title: "Online payments aren't live yet.",
    body: "For now we take payment by bank transfer or GCash. Contact us and we will send the details and set everything up.",
  },
  notfound: {
    art: "door",
    title: "This guide doesn't exist.",
    body: "Check the link or the QR code you scanned. If you think this is a mistake, let us know.",
  },
  unavailable: {
    art: "door",
    title: "This guide is currently unavailable.",
    body: "The host has taken it offline for now. Contact your host for the details you need.",
  },
  expired: {
    art: "door",
    title: "This link has expired.",
    body: "Ask whoever sent it to you for a new one. Your earlier answers are kept and will be there when you open the new link.",
  },
};

function DoorArt() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <path d="M24 86V14a4 4 0 0 1 4-4h40a4 4 0 0 1 4 4v72" stroke="#032747" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 86h68" stroke="#032747" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 22h28v26H34z" stroke="#032747" strokeWidth="2" strokeLinejoin="round" />
      <path d="M34 56h28v22H34z" stroke="#032747" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="60" cy="52" r="3.5" fill="#830000" />
    </svg>
  );
}

function MapArt() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <path d="M12 22l22-8 28 10 22-8v58l-22 8-28-10-22 8z" stroke="#032747" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M34 14v58M62 24v58" stroke="#032747" strokeWidth="2" />
      <path d="M48 36c-5 0-9 4-9 9 0 7 9 15 9 15s9-8 9-15c0-5-4-9-9-9z" stroke="#830000" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="48" cy="45" r="3" fill="#830000" />
    </svg>
  );
}

export default function ComingSoon({ variant = "notfound", title, body, showHome = variant !== "notfound" && variant !== "unavailable" }) {
  const v = VARIANTS[variant] ?? VARIANTS.notfound;

  // Public page: always light, whatever the studio preference is.
  useEffect(() => applyMode("light"), []);

  return (
    <main className="min-h-screen bg-lightgrey text-charcoal px-6 sm:px-12 py-10 flex flex-col">
      <a href={brandUrl("/")} className="inline-flex items-center gap-2.5 no-underline text-charcoal self-start">
        <BrandMark size={30} tile tileColor="#1E1E1E" />
        <Wordmark className="text-[1.375rem]" />
      </a>
      <div className="flex-1 flex flex-col justify-center max-w-xl py-16">
        {v.art === "map" ? <MapArt /> : <DoorArt />}
        <h1 className="font-serif font-normal text-4xl sm:text-5xl text-black mt-8 mb-4">{title ?? v.title}</h1>
        <p className="text-lg leading-relaxed text-[#3c3c3a] mb-8 max-w-md">{body ?? v.body}</p>
        <div className="flex items-center gap-6 flex-wrap">
          <Button variant="primary" size="lg" icon="mail" href={`mailto:${CONTACT_EMAIL}`} className="!bg-maroon !border-maroon !text-[#F4E9E9]">
            Contact us
          </Button>
          {showHome && (
            <a href={brandUrl("/")} className="font-semibold text-charcoal underline underline-offset-4">
              Go to villoguides.com
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
