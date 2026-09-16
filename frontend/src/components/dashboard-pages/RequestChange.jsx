import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { relativeDate, money } from "../../lib/format";
import { useData } from "../../lib/useData";
import { Button } from "../ui/Button";
import { Field, Input, Select, Textarea } from "../ui/Field";
import { Icon } from "../ui/icons";
import { Loading } from "../ui/Loading";
import { Pill, RequestStatus } from "../ui/Pill";
import { EmptyState, Panel } from "../ui/Table";
import { useToast } from "../ui/Toast";
import { DashboardBody } from "../sections/dashboard/DashboardParts";

const TITLES = {
  change: ["Request a change", "Tell us what to update and we will edit the guide for you."],
  removal: ["Request removal", "We will take the guide offline. The link stops working for guests."],
};

/** Clients ask; the studio owner acts. Nothing here edits a guide directly. */
export default function RequestChange({ me }) {
  const { type = "change", guideId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const guides = useData(() => api.listDashboardGuides(me.client.subdomain), []);
  const [target, setTarget] = useState(guideId || "");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setTarget(guideId || ""), [guideId]);

  if (type === "new-property") return <NewPropertyCheckout me={me} />;

  const [title, blurb] = TITLES[type] ?? TITLES.change;
  const adminOnly = type === "removal";

  if (adminOnly && me.user.role !== "admin") {
    return (
      <DashboardBody narrow>
        <Panel>
          <EmptyState icon="lock" title="Admins only">Ask an admin on your team to send this request.</EmptyState>
        </Panel>
      </DashboardBody>
    );
  }

  async function send() {
    setBusy(true);
    setError("");
    try {
      await api.createChangeRequest(
        me.client.subdomain,
        { guideId: target || null, type: type === "removal" ? "removal" : "edit", body },
        me.user.email,
        me.user.role,
      );
      toast("Request sent");
      navigate("/requests");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardBody narrow>
      <h1 className="text-2xl font-semibold m-0 mb-1">{title}</h1>
      <p className="text-muted mt-0 mb-6">{blurb}</p>
      <Panel className="flex flex-col gap-5">
        <Field label="Property" htmlFor="rq-guide">
          <Select id="rq-guide" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">Choose a guide</option>
            {(guides.data || []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.property_name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="What should change?" hint="The more specific, the faster we can do it." htmlFor="rq-body">
          <Textarea
            id="rq-body"
            minRows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={type === "removal" ? "Why this guide should come down" : "The Wi-Fi password changed to..."}
          />
        </Field>
        {error && <p className="text-accent text-sm m-0">{error}</p>}
        <div className="flex gap-2">
          <Button variant="primary" onClick={send} disabled={busy || !body.trim() || !target}>
            Send request
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </Panel>
    </DashboardBody>
  );
}

/**
 * Architecture 5.3's "Request a new property (shows the payment 'coming
 * soon' page in v1)" was always meant to become a real checkout once online
 * payments existed. Admin only, same reasoning as removal: this is the one
 * dashboard action that costs money.
 */
function NewPropertyCheckout({ me }) {
  const [propertyName, setPropertyName] = useState("");
  const [city, setCity] = useState("");
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (me.user.role !== "admin") {
    return (
      <DashboardBody narrow>
        <Panel>
          <EmptyState icon="lock" title="Admins only">Ask an admin on your team to add a property.</EmptyState>
        </Panel>
      </DashboardBody>
    );
  }

  async function pay(chosenProvider) {
    setError("");
    setProvider(chosenProvider);
    try {
      const { redirectUrl } = await api.startPropertyCheckout(me.client.subdomain, {
        provider: chosenProvider,
        propertyName,
        city,
      });
      window.location.href = redirectUrl;
    } catch (e) {
      setError(e.message);
      setProvider(null);
    }
  }

  return (
    <DashboardBody narrow>
      <h1 className="text-2xl font-semibold m-0 mb-1">Add a property</h1>
      <p className="text-muted mt-0 mb-6">
        {money(85000, "PHP")} (about $15) per property, one time. Covers the build, review, publishing, and hosting.
      </p>
      <Panel className="flex flex-col gap-5">
        <Field label="Property name" htmlFor="np-name">
          <Input id="np-name" value={propertyName} onChange={(e) => setPropertyName(e.target.value)} placeholder="Casa Luna" />
        </Field>
        <Field label="City" htmlFor="np-city">
          <Input id="np-city" value={city} onChange={(e) => setCity(e.target.value)} />
        </Field>
        {error && <p className="text-accent text-sm m-0">{error}</p>}
        <div className="border-t border-line-soft pt-5">
          <p className="text-sm font-semibold m-0 mb-3">Choose how to pay</p>
          <div className="flex flex-col gap-2.5">
            <Button
              variant="secondary"
              size="lg"
              block
              icon="wallet"
              disabled={!propertyName.trim() || !!provider}
              onClick={() => pay("xendit")}
            >
              {provider === "xendit" ? "Redirecting" : "GCash, Maya, or bank transfer"}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              block
              icon="brand-paypal"
              disabled={!propertyName.trim() || !!provider}
              onClick={() => pay("paypal")}
            >
              {provider === "paypal" ? "Redirecting" : "PayPal"}
            </Button>
          </div>
          <p className="text-xs text-muted mt-3 mb-0 flex items-center gap-1.5">
            <Icon name="lock" />
            You will finish payment on Xendit's or PayPal's own secure page, not here.
          </p>
        </div>
      </Panel>
      <button type="button" className="text-sm text-muted hover:text-ink mt-4" onClick={() => navigate(-1)}>
        Cancel
      </button>
    </DashboardBody>
  );
}

/** Shown after returning from Xendit or PayPal, whether the payment succeeded, failed, or is still confirming. */
export function NewPropertyComplete({ me }) {
  const params = new URLSearchParams(window.location.search);
  const provider = params.get("provider");
  const guideId = params.get("guide");
  const failed = params.get("failed") === "1";
  const isMock = params.get("mock") === "1";
  const paypalOrderId = params.get("token"); // PayPal appends its own order id under "token" on return
  const navigate = useNavigate();

  const [state, setState] = useState(failed ? "failed" : "checking");
  const [propertyName, setPropertyName] = useState("");

  useEffect(() => {
    if (failed) return;
    let cancelled = false;
    let attempts = 0;

    async function check() {
      try {
        if (provider === "paypal" && paypalOrderId && !isMock) {
          const res = await api.capturePaypalOrder(me.client.subdomain, { guideId, orderId: paypalOrderId });
          if (!cancelled) {
            setState(res.paid ? "paid" : "failed");
          }
          return;
        }

        // Xendit already processed the payment before redirecting here; the
        // webhook that actually marks it paid can lag the redirect by a few
        // seconds, so poll briefly rather than showing failure prematurely.
        const res = await api.getNewPropertyStatus(me.client.subdomain, guideId);
        if (cancelled) return;
        setPropertyName(res.property_name || "");
        if (res.paid) {
          setState("paid");
        } else if (attempts < 6) {
          attempts += 1;
          setTimeout(check, 1500);
        } else {
          setState("pending");
        }
      } catch {
        if (!cancelled) setState("failed");
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [provider, guideId, paypalOrderId, failed, isMock, me.client.subdomain]);

  return (
    <DashboardBody narrow>
      <Panel className="text-center py-12">
        {state === "checking" && (
          <>
            <Icon name="loader-2" className="text-3xl text-muted animate-spin" />
            <p className="font-semibold mt-4 mb-1">Confirming your payment</p>
            <p className="text-muted text-sm m-0">This only takes a moment.</p>
          </>
        )}
        {state === "paid" && (
          <>
            <Icon name="circle-check" className="text-3xl text-ok" />
            <p className="font-semibold mt-4 mb-1">Payment received{propertyName ? `, ${propertyName}` : ""}</p>
            <p className="text-muted text-sm m-0 mb-5">We will build and review the guide, then send an intake link.</p>
            <Button variant="primary" onClick={() => navigate("/")}>
              Back to guides
            </Button>
          </>
        )}
        {state === "pending" && (
          <>
            <Icon name="clock" className="text-3xl text-muted" />
            <p className="font-semibold mt-4 mb-1">Still confirming</p>
            <p className="text-muted text-sm m-0 mb-5">
              This is taking longer than usual. If you completed payment, it will be confirmed shortly; contact us if it
              is not reflected soon.
            </p>
            <Button onClick={() => navigate("/")}>Back to guides</Button>
          </>
        )}
        {state === "failed" && (
          <>
            <Icon name="alert-circle" className="text-3xl text-accent" />
            <p className="font-semibold mt-4 mb-1">Payment not completed</p>
            <p className="text-muted text-sm m-0 mb-5">Nothing was charged. You can try again whenever you are ready.</p>
            <Button onClick={() => navigate("/requests/new-property")}>Try again</Button>
          </>
        )}
      </Panel>
    </DashboardBody>
  );
}

/** List of requests this client has sent. */
export function RequestList({ me }) {
  const reqs = useData(() => api.listDashboardRequests(me.client.subdomain), [me.client.subdomain]);
  const navigate = useNavigate();
  const mine = reqs.data || [];

  return (
    <DashboardBody narrow>
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold m-0">Requests</h1>
          <p className="text-muted mt-1 mb-0">Changes your team has asked for.</p>
        </div>
        <Button icon="plus" onClick={() => navigate("/requests/change")}>
          New request
        </Button>
      </div>
      {reqs.loading ? (
        <Loading />
      ) : mine.length === 0 ? (
        <Panel>
          <EmptyState icon="message-2" title="No requests yet">Open a guide and use "Request a change" to ask for an edit.</EmptyState>
        </Panel>
      ) : (
        <div className="bg-card border border-line rounded-xl">
          {mine.map((r) => (
            <article key={r.id} className="px-6 py-5 border-b border-line-soft last:border-b-0">
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <span className="font-semibold">{r.guide?.property_name ?? "New property"}</span>
                {r.type === "removal" && <Pill tone="warn">Removal</Pill>}
                <RequestStatus status={r.status} />
                <span className="ml-auto text-sm text-muted">{relativeDate(r.created_at)}</span>
              </div>
              <p className="m-0 whitespace-pre-wrap leading-relaxed">{r.body}</p>
              <p className="m-0 mt-1 text-sm text-muted">Sent by {r.requested_by}</p>
            </article>
          ))}
        </div>
      )}
    </DashboardBody>
  );
}
