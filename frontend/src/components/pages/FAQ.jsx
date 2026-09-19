import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CONTACT_EMAIL, contactUrl, demoUrl } from "../../lib/hostname";
import { Icon } from "../ui/icons";
import { BrandHeader, BrandFooter, BackLink } from "../sections/landing/LandingParts";

/*
  villoguides.com/faq. Same plain-language, honest tone as Legal.jsx: answers
  describe what the service actually does, and say so plainly where a policy
  (the refund amount) is still undecided rather than guessing at one.
*/

const GROUPS = [
  {
    heading: "Getting a guide",
    items: [
      [
        "How do I get a guide made?",
        "Email us or reply to the intake link we send you. You fill in a short form on your phone (property details, host info, Wi-Fi, house rules, and so on), and we build the guide from your answers. You can save and come back to the same link any time before you submit.",
      ],
      [
        "How long does it take?",
        "Once you submit the intake form, we review and polish the guide, then publish it after payment is confirmed. Most guides go live within a few days, depending on how much content needs a second look.",
      ],
      [
        "Can I see what a guide looks like first?",
        <>
          Yes. <Link to={demoUrl()} className="text-brand-navy no-underline hover:underline">Open the sample guide</Link> to see a real one, including every section a guide can have.
        </>,
      ],
      [
        "Can I change my guide after it's live?",
        "Yes, as many times as you like. Send us the update, either by email or a change request from your dashboard if you have one, and we republish it. There is no extra fee for updates.",
      ],
    ],
  },
  {
    heading: "Pricing and payment",
    items: [
      [
        "How much does a guide cost?",
        "$15 USD per property (about ₱850), one time. That covers building the guide, our review, publishing, unlimited updates, and hosting for as long as the service runs.",
      ],
      [
        "What if I manage more than one property?",
        "Once you have two or more paid guides, a dashboard for your whole team is included at no extra cost. It lists every guide, so you can open, share, or print the QR sign for any of them in one place.",
      ],
      [
        "I only have one property. Can I still get a dashboard?",
        "Yes, as a one-time $5 add-on. Without it, we send you the link and QR code directly and you share them yourself.",
      ],
      [
        "Can I use my own domain instead of villoguides.com?",
        "Yes, as a paid add-on ($10 USD, one time). It can cover your dashboard, your guides, or both. You add one DNS record on your end and we handle the rest, including the certificate.",
      ],
      [
        "How do I pay?",
        "By bank transfer or GCash, arranged directly with us. We confirm your payment before the guide goes live, and you will see it recorded on your guide's status.",
      ],
      [
        "Do you offer refunds?",
        "Our refund policy is still being finalized and will be published on the Terms of use page before launch. If something's wrong with your guide before it's published, we will fix it, no charge.",
      ],
    ],
  },
  {
    heading: "For your guests",
    items: [
      [
        "Do guests need to download an app or make an account?",
        "No. A guide is a regular web page. Guests open the link or scan the printed QR code at the door, and it works in any phone's browser.",
      ],
      [
        "Is it safe to put a door or lockbox code in the guide?",
        "Put it in the guide's private block instead of anywhere else. That block stays locked behind a PIN you share with the guest yourself (by text or email), separately from the guide link, so it never shows up to anyone who only has the link. Anywhere else in the guide is public to anyone with the link, and the form warns you if something you type looks like a code.",
      ],
      [
        "Does the guide work if a guest has no signal?",
        "Once a guest has opened the guide, their phone keeps a copy for offline use, so the basics stay reachable even without signal.",
      ],
    ],
  },
  {
    heading: "Trust and privacy",
    items: [
      [
        "Is my information private?",
        <>
          Intake answers and photos stay private until the guide is published. See the{" "}
          <Link to="/privacy" className="text-brand-navy no-underline hover:underline">privacy policy</Link> for exactly what we collect and why.
        </>,
      ],
      [
        "Can I take a guide down?",
        "Yes. Send a removal request from your dashboard, or email us, and we take it offline.",
      ],
      [
        "What if I see a guide with wrong or inappropriate content?",
        <>
          Use the <Link to="/report" className="text-brand-navy no-underline hover:underline">report a guide</Link> link in any guide's footer. We read every report and can suspend a guide right away if it breaks our terms.
        </>,
      ],
    ],
  },
];

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-[#dcdcd9]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-6 py-5 text-left bg-transparent border-0 cursor-pointer"
      >
        <span className="text-lg font-semibold text-black">{q}</span>
        <Icon name={open ? "minus" : "plus"} className="text-xl text-brand-navy shrink-0" />
      </button>
      {open && <p className="m-0 pb-6 pr-10 text-[#3c3c3a] leading-relaxed max-w-[62ch]">{a}</p>}
    </div>
  );
}

export default function FAQ() {
  const [openKey, setOpenKey] = useState(null);

  useEffect(() => {
    document.title = "FAQ, Villo Guides";
  }, []);

  return (
    <>
      <BrandHeader />
      <main className="max-w-[760px] mx-auto px-5 sm:px-10 py-12">
        <BackLink />
        <h1 className="font-serif font-normal text-4xl text-black m-0 mb-3">Frequently asked questions</h1>
        <p className="text-lg leading-relaxed text-[#3c3c3a] m-0 mb-12 max-w-[52ch]">
          Answers to what people usually ask before getting a guide. Can't find yours? Email us directly.
        </p>
        {GROUPS.map((group) => (
          <section key={group.heading} className="mb-12 last:mb-0">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted m-0 mb-1">{group.heading}</h2>
            <div className="border-t border-[#dcdcd9]">
              {group.items.map(([q, a]) => {
                const key = `${group.heading}:${q}`;
                return <FaqItem key={key} q={q} a={a} open={openKey === key} onToggle={() => setOpenKey(openKey === key ? null : key)} />;
              })}
            </div>
          </section>
        ))}
        <p className="text-muted m-0 mt-4">
          Still have a question? Email <a href={contactUrl("Question from the FAQ page")} target="_blank" rel="noopener noreferrer" className="text-brand-navy">{CONTACT_EMAIL}</a>.
        </p>
      </main>
      <BrandFooter />
    </>
  );
}
