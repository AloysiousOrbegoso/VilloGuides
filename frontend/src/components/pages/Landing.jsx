import { BrandHeader, BrandFooter, ContactStrip, Hero, HowItWorks, Pricing, WhatsInside } from "../sections/landing/LandingParts";

/** villoguides.com. Becomes the full marketing page later without changing structure. */
export default function Landing() {
  return (
    <>
      <BrandHeader />
      <Hero />
      <HowItWorks />
      <WhatsInside />
      <Pricing />
      <ContactStrip />
      <BrandFooter />
    </>
  );
}
