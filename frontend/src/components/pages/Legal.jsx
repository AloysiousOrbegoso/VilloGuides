import { useEffect } from "react";
import { CONTACT_EMAIL } from "../../lib/hostname";
import { BrandHeader, BrandFooter } from "../sections/landing/LandingParts";

/*
  Placeholder legal text. Architecture section 16 lists the privacy policy and terms
  as still to be drafted, with legal review recommended before launch. The wording
  below describes what the service actually does so it can be reviewed and replaced.
*/

const PRIVACY = [
  [
    "What we collect",
    "When a property owner fills in an intake form we collect the details they enter: the property name and address, host name, phone number, email, messenger username, Wi-Fi details, house information, and any photos they upload. For client staff we store the email addresses used to sign in.",
  ],
  [
    "Why we collect it",
    "The details are used to build and publish the guidebook for that property, and to contact the owner about it. Staff emails are used only to control who can sign in to a client dashboard.",
  ],
  [
    "Who can see it",
    "A published guide is public to anyone who has its link. Intake answers and uploaded photos stay private until the guide is published. Internal notes in a client dashboard are never shown to guests.",
  ],
  [
    "Door and lockbox codes",
    "Please do not put door codes, lockbox codes, or alarm codes in a guide. The intake form and our review both warn about this. Send codes to guests privately instead.",
  ],
  ["How long we keep it", "Guide content and photos are kept while the guide is live and for a reasonable period after it is taken down, so it can be restored."],
  [
    "Your rights",
    "You can ask for a copy of your information, ask us to correct it, or ask us to delete it. This service is operated from the Philippines and follows the Data Privacy Act of 2012.",
  ],
  ["Cookies", "Guides use no tracking cookies. The studio and client dashboards use a sign-in cookie issued by Cloudflare Access."],
];

const TERMS = [
  [
    "Agreement to these terms",
    "By sending us an intake form, paying for a guide, or using a client dashboard, you agree to these terms. If you are agreeing on behalf of a company, you confirm you have the authority to do so.",
  ],
  ["The service", "VilloGuides builds and hosts digital guidebooks for rental properties. Each guide has its own web address and is shared by link or QR code. Clients with two or more paid guides, or who have paid the single-property add-on, also get a dashboard to manage their guides."],
  [
    "Your content",
    "You keep ownership of everything you send us. You confirm you have the right to share the details and photos you provide, including photos of people, and that doing so does not break the law or infringe anyone else's rights. You give us permission to publish your content as part of your guide and to use it to operate the service, for example by showing it to you in the intake form and studio while your guide is being built.",
  ],
  [
    "What you may not publish",
    "No unlawful, misleading, or offensive content. No security codes for a property outside the dedicated private, PIN-protected block built for that purpose. No personal information about other people without their permission.",
  ],
  [
    "Third-party links and embeds",
    "A guide may link to Google Maps or embed a YouTube or Vimeo video you provide. Those services are run by their own companies under their own terms, and we are not responsible for their content or availability.",
  ],
  [
    "Payment",
    "Guides are a one-time fee per property. Add-ons, such as a single-property dashboard or a white-label custom domain, are also one-time fees. Payment is arranged directly with us and confirmed before publishing or activating an add-on. Hosting is included for as long as the service runs.",
  ],
  [
    "Changes and removal",
    "You can ask for updates at any time. To take a guide down, send a removal request from your dashboard or email us. We may suspend a guide that breaks these terms or is reported for good reason, and we will try to tell you why.",
  ],
  ["Availability", "We aim to keep guides online continuously but do not guarantee uninterrupted service, and are not liable for losses caused by downtime outside our reasonable control."],
  ["Refunds", "The refund policy is still being finalised and will be published here before launch."],
  [
    "Our liability",
    "The service is provided as described here, without further guarantees. To the extent the law allows, we are not liable for indirect losses, and our total liability to you is limited to the amount you paid us for the guide or add-on the claim relates to.",
  ],
  [
    "Changes to these terms",
    "We may update these terms as the service changes. We will change the date at the top of this page when we do, and continued use of the service after a change means you accept the update.",
  ],
  ["Governing law", "These terms are governed by the laws of the Republic of the Philippines, where the service is operated."],
];

function LegalPage({ title, updated, intro, sections }) {
  useEffect(() => {
    document.title = `${title}, Villo Guides`;
  }, [title]);
  return (
    <>
      <BrandHeader />
      <main className="max-w-[760px] mx-auto px-5 sm:px-10 py-12">
        <h1 className="font-serif font-normal text-4xl text-black m-0 mb-3">{title}</h1>
        <p className="text-muted m-0 mb-8">Last updated {updated}</p>
        <p className="text-lg leading-relaxed text-[#3c3c3a] m-0 mb-10">{intro}</p>
        {sections.map(([h, b]) => (
          <section key={h} className="mb-8">
            <h2 className="text-xl font-semibold m-0 mb-2">{h}</h2>
            <p className="m-0 leading-relaxed text-[#3c3c3a]">{b}</p>
          </section>
        ))}
        <p className="text-muted m-0 mt-12">
          Questions? Email <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-navy">{CONTACT_EMAIL}</a>.
        </p>
      </main>
      <BrandFooter />
    </>
  );
}

export function Privacy() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="September 2026"
      intro="This policy explains what we collect when we build a guidebook for a property, why we collect it, and who can see it. It is a working draft and will be reviewed by a lawyer before launch."
      sections={PRIVACY}
    />
  );
}

export function Terms() {
  return (
    <LegalPage
      title="Terms of use"
      updated="September 2026"
      intro="These terms cover the intake form, the guides we publish, and the dashboards we provide. They are a working draft and will be reviewed by a lawyer before launch."
      sections={TERMS}
    />
  );
}
