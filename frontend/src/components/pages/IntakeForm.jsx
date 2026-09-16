import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../lib/api";
import { INTAKE_STEPS, emptyAnswers, mapIntakeToGuide, missingRequired, stepFilled } from "../../lib/intakeMapper";
import { useForcedLight } from "../../lib/theme";
import { Button, IconButton } from "../ui/Button";
import { Icon, BrandMark } from "../ui/icons";
import { Loading } from "../ui/Loading";
import { GuideRoot } from "../shell/GuideRoot";
import {
  AmenitiesStep, BrandingStep, CheckinStep, EmergencyStep, HostStep, KitchenStep, PetsStep,
  PhotosStep, PlacesStep, PropertyStep, ReviewStep, RulesStep, SustainabilityStep, WifiStep,
} from "../sections/intake/Steps";
import ComingSoon from "./ComingSoon";

/*
  forms.villoguides.com/{token} (architecture 5.4). No account: the token is the key.
  Mobile-first, autosaving, with a live preview of the guide taking shape.
*/

const STEP_COMPONENTS = {
  property: PropertyStep,
  host: HostStep,
  checkin: CheckinStep,
  wifi: WifiStep,
  rules: RulesStep,
  amenities: AmenitiesStep,
  kitchen: KitchenStep,
  emergency: EmergencyStep,
  pets: PetsStep,
  sustainability: SustainabilityStep,
  branding: BrandingStep,
};

const AUTOSAVE_MS = 800;
const MAX_PHOTOS = 25;

export default function IntakeForm({ token }) {
  useForcedLight();
  const [state, setState] = useState({ loading: true });
  const [answers, setAnswers] = useState(null);
  const [stage, setStage] = useState("welcome");
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [photoError, setPhotoError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const timer = useRef();
  const scroller = useRef(null);

  useEffect(() => {
    let alive = true;
    api.getIntake(token).then(
      (d) => {
        if (!alive) return;
        setAnswers(d.answers ?? emptyAnswers());
        setState({ loading: false, clientName: d.client_name, status: d.status });
        if (d.status === "submitted") setStage("sent");
      },
      (e) => alive && setState({ loading: false, error: e }),
    );
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    document.title = "Your guide details";
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [index, stage]);

  const save = useCallback(
    (next) => {
      setSaving(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try {
          await api.saveIntake(token, next);
        } finally {
          setSaving(false);
        }
      }, AUTOSAVE_MS);
    },
    [token],
  );

  const update = useCallback(
    (next) => {
      setAnswers(next);
      save(next);
    },
    [save],
  );

  const set = useCallback(
    (section, patch) =>
      setAnswers((a) => {
        const next = { ...a, [section]: { ...a[section], ...patch } };
        save(next);
        return next;
      }),
    [save],
  );

  const filled = useMemo(() => {
    if (!answers) return {};
    return Object.fromEntries(INTAKE_STEPS.map((s) => [s.id, s.id === "review" ? true : stepFilled(answers, s.id)]));
  }, [answers]);

  const missing = useMemo(() => (answers ? missingRequired(answers) : {}), [answers]);
  const previewContent = useMemo(() => (answers && preview ? mapIntakeToGuide(answers) : null), [answers, preview]);

  async function uploadPhotos(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    const current = (answers.photos.cover ? 1 : 0) + answers.photos.gallery.length;
    const room = MAX_PHOTOS - current;
    setPhotoError(room <= 0 ? `You have reached the limit of ${MAX_PHOTOS} photos.` : "");
    const batch = list.slice(0, Math.max(0, room));
    setUploading(batch.length);
    for (const file of batch) {
      try {
        const { url } = await api.uploadIntakePhoto(token, file);
        setAnswers((a) => {
          const photos = a.photos.cover ? { ...a.photos, gallery: [...a.photos.gallery, { url, caption: "" }] } : { ...a.photos, cover: url };
          const next = { ...a, photos };
          save(next);
          return next;
        });
      } catch (e) {
        setPhotoError(e.message);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function submit() {
    setSubmitError("");
    try {
      clearTimeout(timer.current);
      await api.submitIntake(token, answers);
      setStage("sent");
    } catch (e) {
      setSubmitError(e.message);
    }
  }

  if (state.loading) return <Loading full />;
  if (state.error) return <ComingSoon variant={state.error.status === 410 ? "expired" : "notfound"} />;

  if (stage === "welcome") return <Welcome answers={answers} clientName={state.clientName} onStart={() => setStage("form")} />;
  if (stage === "sent") return <Sent answers={answers} onEdit={() => setStage("form")} />;

  const step = INTAKE_STEPS[index];
  const Step = STEP_COMPONENTS[step.id];
  const last = index === INTAKE_STEPS.length - 1;
  const progress = Math.round(((index + 1) / INTAKE_STEPS.length) * 100);
  const goTo = (stepId) => setIndex(INTAKE_STEPS.findIndex((s) => s.id === stepId));

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col mx-auto max-w-[520px]">
      <header className="shrink-0 px-6 pt-5">
        <div className="flex items-center justify-between pb-4">
          <span className="font-semibold text-md truncate">{answers.property.name || "Your property"}</span>
          <Button size="sm" icon="eye" onClick={() => setPreview(true)} className="rounded-full">
            Preview
          </Button>
        </div>
        <div className="flex justify-between text-sm text-muted mb-2">
          <span>
            Step {index + 1} of {INTAKE_STEPS.length}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name={saving ? "loader-2" : "cloud-check"} className={saving ? "animate-spin" : ""} />
            {saving ? "Saving" : "Saved"}
          </span>
        </div>
        <div className="h-[3px] rounded bg-line overflow-hidden">
          <div className="h-full bg-navy transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="flex-1 px-6 pt-9 pb-6" ref={scroller}>
        <h1 className="font-serif font-medium text-3xl tracking-tight m-0 mb-7">{step.title}</h1>
        {last ? (
          <ReviewStep
            answers={answers}
            steps={INTAKE_STEPS}
            filled={filled}
            missing={missing}
            onGoTo={goTo}
            onConsent={(consent) => update({ ...answers, consent })}
          />
        ) : step.id === "places" ? (
          <PlacesStep answers={answers} setAnswers={update} />
        ) : step.id === "photos" ? (
          <PhotosStep answers={answers} setAnswers={update} onUpload={uploadPhotos} uploading={uploading} error={photoError} />
        ) : (
          <Step answers={answers} set={set} />
        )}
        {submitError && <p className="text-accent text-md mt-5 mb-0">{submitError}</p>}
      </main>

      <footer className="shrink-0 flex gap-3 px-6 pb-8 pt-4">
        {index > 0 && <IconButton icon="arrow-left" label="Back" size="lg" onClick={() => setIndex(index - 1)} />}
        {last ? (
          <Button variant="primary" size="lg" block onClick={submit} disabled={!answers.consent || Object.keys(missing).length > 0}>
            Send for review
          </Button>
        ) : (
          <Button variant="primary" size="lg" block onClick={() => setIndex(index + 1)}>
            Continue
          </Button>
        )}
      </footer>

      {preview && <PreviewSheet content={previewContent} onClose={() => setPreview(false)} />}
    </div>
  );
}

function Welcome({ answers, clientName, onStart }) {
  const name = answers.property.name || "your property";
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col mx-auto max-w-[520px] px-7 pt-14 pb-8">
      <BrandMark size={34} tile tileColor="#1E1E1E" className="mb-14" />
      <h1 className="font-serif font-medium text-4xl leading-tight tracking-tight m-0 mb-4">Let's build the guide for {name}</h1>
      <p className="text-lg leading-relaxed text-ink/80 m-0 mb-8">
        Your answers become a guidebook your guests open on their phones. Everything saves as you go, so you can stop and come back with this same link.
      </p>
      <ul className="list-none m-0 p-0 mb-7">
        {[
          ["wifi", "Wi-Fi name and password"],
          ["clock", "Check-in and check-out times"],
          ["photo", "Photos of the place"],
          ["map-pin", "Places nearby you recommend"],
        ].map(([icon, label]) => (
          <li key={label} className="flex items-center gap-3.5 py-2.5 text-md text-ink/80">
            <Icon name={icon} className="text-xl text-navy" />
            {label}
          </li>
        ))}
      </ul>
      <div className="flex-1" />
      <Button variant="primary" size="lg" block onClick={onStart}>
        Start
      </Button>
      {clientName && <p className="text-center text-sm text-muted mt-4 mb-0">Managed by {clientName}</p>}
    </div>
  );
}

function Sent({ answers, onEdit }) {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col mx-auto max-w-[520px] px-7 pt-24 pb-8">
      <div className="relative w-16 h-16 rounded-full border-[1.5px] border-navy grid place-items-center mb-8">
        <Icon name="send" className="text-2xl text-navy" />
        <span className="absolute right-px top-1 w-2.5 h-2.5 rounded-full bg-accent" />
      </div>
      <h1 className="font-serif font-medium text-4xl tracking-tight m-0 mb-4">Your answers are in</h1>
      <p className="text-lg leading-relaxed text-ink/80 m-0">We will review everything and polish the guide for {answers.property.name || "your property"}.</p>
      <ol className="list-none m-0 p-0 mt-7 mb-8">
        {["We check your details and photos.", "We message you if anything needs a second look.", "You receive the guide link and a QR code to print."].map((t, i) => (
          <li key={t} className="grid grid-cols-[36px_1fr] text-md leading-relaxed text-ink/80 mb-4">
            <span className="font-serif text-xl text-navy leading-tight">{i + 1}</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted m-0">Need to change something? Open this link again. Your answers are still here.</p>
      <div className="flex-1" />
      <Button size="lg" block onClick={onEdit}>
        Edit my answers
      </Button>
    </div>
  );
}

/** Slides up over any step so owners can see the guide taking shape. */
function PreviewSheet({ content, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-scrim flex items-end justify-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Preview of your guide" className="w-full max-w-[520px] h-[90%] bg-card rounded-t-3xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3.5 shrink-0">
          <b className="text-md">Your guide so far</b>
          <IconButton icon="x" label="Close preview" onClick={onClose} className="rounded-full" />
        </div>
        <div className="flex-1 min-h-0 relative overflow-hidden [transform:translateZ(0)]">
          <GuideRoot content={content} layout="mobile" embedded switcher={false} />
        </div>
      </div>
    </div>
  );
}
