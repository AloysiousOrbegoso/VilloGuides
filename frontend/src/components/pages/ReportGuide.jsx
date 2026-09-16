import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { CONTACT_EMAIL } from "../../lib/hostname";
import { Button } from "../ui/Button";
import { Field, Input, Select, Textarea } from "../ui/Field";
import { Icon } from "../ui/icons";
import { BrandHeader, BrandFooter } from "../sections/landing/LandingParts";

const REASONS = [
  ["wrong", "Something in it is wrong or out of date"],
  ["private", "It shows private information, such as a door code"],
  ["offensive", "The content is offensive or inappropriate"],
  ["impersonation", "It is not the real owner of this property"],
  ["other", "Something else"],
];

/** Flag a guide with wrong or inappropriate content (architecture 5.1). */
export default function ReportGuide() {
  const [params] = useSearchParams();
  const [guide, setGuide] = useState(params.get("guide") || "");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Report a guide, Villo Guides";
  }, []);

  async function send() {
    setBusy(true);
    setError("");
    try {
      await api.reportGuide({ guide, reason, details, email });
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <BrandHeader />
      <main className="max-w-[640px] mx-auto px-5 sm:px-10 py-12">
        {sent ? (
          <>
            <Icon name="circle-check" className="text-4xl text-brand-navy" />
            <h1 className="font-serif font-normal text-4xl text-black mt-6 mb-3">Thank you, we have your report</h1>
            <p className="text-lg leading-relaxed text-[#3c3c3a] m-0">
              We read every report. If the guide breaks our terms we can take it offline straight away. We will reply if you left an email address.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-serif font-normal text-4xl text-black m-0 mb-3">Report a guide</h1>
            <p className="text-lg leading-relaxed text-[#3c3c3a] m-0 mb-9">
              Tell us what is wrong with a guide and we will look into it. If you are a guest with a question about your stay, contact your host instead.
            </p>
            <div className="flex flex-col gap-6">
              <Field label="Which guide?" hint="The address you opened, for example casaluna.villoguides.com" size="lg" htmlFor="rg-guide">
                <Input id="rg-guide" size="lg" value={guide} onChange={(e) => setGuide(e.target.value)} />
              </Field>
              <Field label="What is the problem?" size="lg" htmlFor="rg-reason">
                <Select id="rg-reason" size="lg" value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="">Choose a reason</option>
                  {REASONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tell us more" size="lg" htmlFor="rg-details">
                <Textarea id="rg-details" size="lg" minRows={4} value={details} onChange={(e) => setDetails(e.target.value)} />
              </Field>
              <Field label="Your email" hint="Optional, only so we can reply" size="lg" htmlFor="rg-email">
                <Input id="rg-email" size="lg" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              {error && <p className="text-accent m-0">{error}</p>}
              <div>
                <Button variant="primary" size="lg" onClick={send} disabled={busy || !reason || !guide.trim()} className="!bg-maroon !border-maroon !text-[#F4E9E9]">
                  Send report
                </Button>
              </div>
              <p className="text-sm text-muted m-0">
                Urgent? Email <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-navy">{CONTACT_EMAIL}</a>.
              </p>
            </div>
          </>
        )}
      </main>
      <BrandFooter />
    </>
  );
}
