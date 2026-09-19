import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { CONTACT_EMAIL, contactUrl, demoUrl, GUIDE_REQUEST_BODY } from "../../../lib/hostname";
import { KITCHEN_ICON } from "../../../lib/guideSchema";
import { Button } from "../../ui/Button";
import { Icon } from "../../ui/icons";
import { Reveal } from "../../ui/Reveal";
import logoLockup from "../../../assets/brand/logo-lockup.svg";
import howItWorks1 from "../../../assets/landing/how-it-works-1.png";
import howItWorks2 from "../../../assets/landing/how-it-works-2.png";
import howItWorks3 from "../../../assets/landing/how-it-works-3.png";

/*
  villoguides.com (architecture 5.1). Always light, EB Garamond for headlines,
  Open Sans for everything else. Maroon appears only on the one real action.
*/

export function BrandHeader() {
  return (
    <header className="max-w-[1120px] mx-auto px-5 sm:px-10 pt-7 pb-8 flex items-center justify-between">
      <Link to="/" className="flex items-center no-underline text-charcoal">
        <img src={logoLockup} alt="Villo Guides" style={{ height: 56, width: "auto", display: "block" }} />
      </Link>
      <nav className="hidden sm:flex gap-9 text-md">
        <a href="#how" className="text-charcoal/80 no-underline hover:text-charcoal">
          How it works
        </a>
        <a href="#pricing" className="text-charcoal/80 no-underline hover:text-charcoal">
          Pricing
        </a>
        <Link to="/faq" className="text-charcoal/80 no-underline hover:text-charcoal">
          FAQ
        </Link>
        <a href={demoUrl()} className="text-charcoal/80 no-underline hover:text-charcoal">
          Sample guide
        </a>
      </nav>
    </header>
  );
}

/** Top-of-page link back to the brand site, for every secondary page (Privacy, Terms, FAQ, Report) except the landing page itself. */
export function BackLink() {
  return (
    <Link to="/" className="inline-flex items-center gap-1.5 text-muted no-underline hover:text-charcoal mb-8">
      <Icon name="arrow-left" />
      Back to villoguides.com
    </Link>
  );
}

export function Hero() {
  return (
    <section className="max-w-[1120px] mx-auto px-5 sm:px-10">
      <div className="bg-lightgrey rounded-3xl grid lg:grid-cols-[1.05fr_0.95fr] overflow-hidden min-h-[600px]">
        <div className="px-6 sm:px-16 py-16 sm:py-20 flex flex-col justify-center animate-fade-up">
          <h1 className="font-serif font-normal text-4xl sm:text-5xl leading-[1.08] text-black m-0 mb-6 tracking-tight">Your house manual, on every guest's phone</h1>
          <p className="text-xl leading-relaxed text-[#3c3c3a] m-0 mb-10 max-w-[28em]">
            We turn your property details into a guidebook with its own link. Guests scan the QR code at the door and find the Wi-Fi password, check-in steps, and
            house rules without messaging you. No app to download and no account to make.
          </p>
          <div className="flex items-center gap-7 flex-wrap">
            <Button variant="primary" size="lg" icon="device-mobile" href={demoUrl()} className="!bg-maroon !border-maroon !text-[#F4E9E9]">
              Open the sample guide
            </Button>
            <a href={contactUrl("Want a guide for my place", GUIDE_REQUEST_BODY)} target="_blank" rel="noopener noreferrer" className="font-semibold text-charcoal underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
        <div className="relative hidden lg:block animate-fade-up [animation-delay:150ms]">
          <HeroArt />
        </div>
      </div>
    </section>
  );
}

/** A printed sign next to a phone: how guests actually meet a guide. */
function HeroArt() {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-[-40px] pr-6">
      <div className="bg-white rounded-lg shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)] px-6 py-7 w-56 translate-x-6 rotate-[-4deg] z-10">
        <p className="font-serif text-xl text-black m-0 mb-1 leading-tight">Welcome to Casa de Vista</p>
        <p className="text-xs text-[#5a5a58] m-0 mb-4 leading-relaxed">Scan for Wi-Fi, check-in, and everything else about the house.</p>
         <div className="bg-white ml-6">
          <QRCodeCanvas
            value="https://demo.villoguides.com"
            size={200}
            level="M"
            marginSize={1}
            className="-rotate-0.1"
          />
        </div>
        <p className="text-[10px] text-[#5a5a58] m-0 mt-3 text-right">demo.villoguides.com</p>
      </div>
      <div className="w-[236px] h-[460px] rounded-[34px] bg-[#111] p-2 shadow-[0_24px_50px_-26px_rgba(0,0,0,0.6)] z-20">
        <div className="h-full rounded-[27px] overflow-hidden bg-[#F7F2EA] flex flex-col">
          <div className="h-32 bg-gradient-to-b from-[#A9C6C3] via-[#CBDDD7] to-[#E6D9C1] relative">
            <span className="absolute right-5 top-5 w-5 h-5 rounded-full bg-white/80" />
          </div>
          <div className="px-4 pt-3 pb-2">
            <p className="font-serif text-xl text-[#1F3B3A] m-0 leading-none">Casa de Vista</p>
            <p className="text-[10px] text-[#4E5A55] m-0 mt-1">A small beach house on the La Union coast</p>
          </div>
          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            {[
              ["home", "Welcome"],
              ["key", "Check-In/Out"],
              ["wifi", "WiFi"],
              ["list-check", "House Rules"],
              ["map-pin", "Explore"],
              ["alert-triangle", "Emergency"],
            ].map(([icon, label], i) => (
              <div
                key={label}
                className={`rounded-xl border px-2.5 py-2.5 flex flex-col gap-3 ${i === 5 ? "bg-[#F6E1D3] border-[#E3C3AC]" : "bg-white border-[#E2D9CA]"}`}
              >
                <Icon name={icon} className={`text-lg ${i === 5 ? "text-[#C4622D]" : "text-[#3E7C7B]"}`} />
                <span className={`text-[11px] font-semibold ${i === 5 ? "text-[#8A3F15]" : "text-[#1F3B3A]"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ id, children }) {
  return (
    <section id={id} className="max-w-[1120px] mx-auto px-5 sm:px-10 pt-24 sm:pt-38">
      {children}
    </section>
  );
}

const HOW_IT_WORKS_STEPS = [
  {
    shot: howItWorks1,
    alt: "The intake form, open on a phone",
    title: "Fill in a short form on your phone",
    body: "We send you a private link. Add details and photos at your own pace. Your progress saves as you go.",
    tilt: "-rotate-[4deg]",
  },
  {
    shot: howItWorks2,
    alt: "Confirmation screen after sending answers for review",
    title: "We build and check your guide",
    body: "Your answers become a finished guide in your property's own colors. We read every page before it goes live.",
    tilt: "rotate-[2deg] translate-y-1.5",
  },
  {
    shot: howItWorks3,
    alt: "The finished guide, live on a phone",
    title: "Share the link or print the QR sign",
    body: "Each guide has its own address. Send it before arrival or leave the sign by the door.",
    tilt: "-rotate-[3deg]",
  },
];

function StepPhone({ shot, alt, tilt }) {
  return (
    <div className="flex justify-center">
      <div className={`relative w-[236px] h-[460px] rounded-[34px] bg-[#111] p-2 shadow-[0_30px_60px_-26px_rgba(0,0,0,0.5)] ${tilt}`}>
        <span className="absolute z-10 top-5 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-[#111]" />
        <div className="h-full rounded-[27px] overflow-hidden">
          <img src={shot} alt={alt} className="w-full h-full object-cover object-top block" />
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <Section id="how">
      <div className="max-w-lg mx-auto text-center mb-16">
        <h2 className="font-serif font-normal text-4xl text-black m-0 mb-3.5">How it works</h2>
        <p className="text-muted m-0">You answer questions about the place. We handle the building, checking, and hosting.</p>
      </div>
      {HOW_IT_WORKS_STEPS.map((step, i) => {
        const reverse = i % 2 === 1;
        return (
          <Reveal
            key={step.title}
            as="div"
            className="flex flex-col-reverse items-center gap-9 text-center py-14 border-t border-[#dcdcd9] first:border-t-0 lg:grid lg:grid-cols-2 lg:gap-14 lg:text-left"
          >
            <div className={reverse ? "lg:order-2" : "lg:order-1"}>
              <span className="font-serif italic text-5xl text-brand-navy/90">{`0${i + 1}`}</span>
              <h3 className="text-2xl font-semibold mt-3 mb-3.5 leading-tight">{step.title}</h3>
              <p className="m-0 text-[#4a4a48] leading-relaxed max-w-[34ch] mx-auto lg:mx-0">{step.body}</p>
            </div>
            <div className={reverse ? "lg:order-1" : "lg:order-2"}>
              <StepPhone shot={step.shot} alt={step.alt} tilt={step.tilt} />
            </div>
          </Reveal>
        );
      })}
    </Section>
  );
}

export function WhatsInside() {
  const items = [
    ["home", "Welcome"],
    ["users", "Meet the hosts"],
    ["key", "Check-in and out"],
    ["sparkles", "Amenities"],
    ["wifi", "Wi-Fi, one tap to copy"],
    ["list-check", "House rules"],
    [KITCHEN_ICON, "Kitchen"],
    ["map-pin", "Places nearby"],
    ["alert-triangle", "Emergency numbers"],
    ["paw", "Pet policy"],
    ["leaf", "Sustainability"],
    ["phone", "Contact the host"],
  ];
  return (
    <Section>
      <Reveal>
        <h2 className="font-serif font-normal text-3xl text-black m-0 mb-10">What a guide can include</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-9">
          {items.map(([icon, label]) => (
            <div key={label} className="flex items-center gap-3.5">
              <Icon name={icon} className="text-xl text-brand-navy" />
              <span className="text-md text-[#3c3c3a]">{label}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

export function Pricing() {
  return (
    <Section id="pricing">
      <Reveal as="div" className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-20">
        <div>
          <h2 className="font-serif font-normal text-4xl text-black m-0 mb-4 leading-tight">Pricing</h2>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="font-serif text-5xl text-black leading-none">$15</span>
            <span className="text-muted">per property, paid once</span>
          </div>
          <p className="text-muted m-0 mb-6">About ₱850.</p>
          <ul className="list-none m-0 p-0">
            {["We build and review your guide", "Unlimited updates when details change", "Hosting included for as long as the service runs"].map((t) => (
              <li key={t} className="flex gap-3 py-2 text-[#3c3c3a]">
                <Icon name="check" className="text-brand-navy mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-[#dcdcd9] pt-8">
          {[
            [
              "Managing more than one property?",
              "With two or more guides, your team gets a dashboard to search every guide, copy links, and print QR signs. It is included at no extra cost.",
            ],
            ["Just one property?", "You receive the link and QR code directly. A dashboard is available as a $5 one-time add-on."],
            ["Paying", "Pay by bank transfer or GCash. We confirm your payment before your guide goes live."],
          ].map(([h, b]) => (
            <div key={h} className="mb-7 last:mb-0">
              <h3 className="text-lg font-semibold m-0 mb-1.5">{h}</h3>
              <p className="m-0 text-[#4a4a48] leading-relaxed max-w-[34em]">{b}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

export function ContactStrip() {
  return (
    <div className="max-w-[1120px] mx-auto px-5 sm:px-10">
      <Reveal as="div" className="flex items-center justify-between gap-6 flex-wrap mt-24 sm:mt-38 pt-14 pb-24 border-t border-[#dcdcd9]">
        <h2 className="font-serif font-normal text-3xl sm:text-4xl text-black m-0">Want a guide for your place?</h2>
        <Button variant="primary" size="lg" icon="mail" href={contactUrl("Want a guide for my place", GUIDE_REQUEST_BODY)} target="_blank" rel="noopener noreferrer" className="!bg-maroon !border-maroon !text-[#F4E9E9]">
          Email {CONTACT_EMAIL}
        </Button>
      </Reveal>
    </div>
  );
}

export function BrandFooter() {
  return (
    <footer className="bg-charcoal text-offwhite">
      <div className="max-w-[1120px] mx-auto px-5 sm:px-10 py-7 flex items-center justify-between gap-6 flex-wrap text-sm">
        <nav className="flex gap-7 flex-wrap">
          <Link to="/faq" className="text-offwhite/80 no-underline hover:text-offwhite">
            FAQ
          </Link>
          <Link to="/privacy" className="text-offwhite/80 no-underline hover:text-offwhite">
            Privacy policy
          </Link>
          <Link to="/terms" className="text-offwhite/80 no-underline hover:text-offwhite">
            Terms of use
          </Link>
          <Link to="/report" className="text-offwhite/80 no-underline hover:text-offwhite">
            Report a guide
          </Link>
        </nav>
        <span className="text-offwhite/50">© {new Date().getFullYear()} VilloGuides</span>
      </div>
    </footer>
  );
}
