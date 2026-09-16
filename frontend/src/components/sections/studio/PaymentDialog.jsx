import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { Button } from "../../ui/Button";
import { Dialog } from "../../ui/Dialog";
import { Field, Input, Select } from "../../ui/Field";

const METHODS = ["GCash", "Bank transfer", "Cash", "Other"];

/**
 * Records a manual payment (architecture 2, v1 is manual). Amounts are stored in the
 * smallest unit. Defaults follow the price list: $15 or about 850 pesos per guide.
 */
export function PaymentDialog({ open, onClose, guide, onSaved }) {
  const [method, setMethod] = useState("GCash");
  const [currency, setCurrency] = useState("PHP");
  const [amount, setAmount] = useState("850");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setError("");
      setReference("");
    }
  }, [open]);

  useEffect(() => {
    setAmount(currency === "USD" ? "15" : "850");
  }, [currency]);

  async function save() {
    setBusy(true);
    setError("");
    try {
      const g = await api.markPaid(guide.id, {
        method,
        currency,
        amount: Math.round(parseFloat(amount) * 100),
        reference,
        paidAt: new Date(`${date}T12:00:00`).toISOString(),
      });
      onSaved?.(g);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Mark as paid"
      description={guide ? `${guide.property_name}, ${guide.client?.name ?? ""}` : ""}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            Save payment
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Method" htmlFor="pm-method" className="col-span-2">
          <Select id="pm-method" value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
        <Field label="Amount" htmlFor="pm-amount">
          <Input id="pm-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
        </Field>
        <Field label="Currency" htmlFor="pm-cur">
          <Select id="pm-cur" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="PHP">PHP</option>
            <option value="USD">USD</option>
          </Select>
        </Field>
        <Field label="Reference" htmlFor="pm-ref" hint="Transaction or receipt number" className="col-span-2">
          <Input id="pm-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>
        <Field label="Date received" htmlFor="pm-date" className="col-span-2">
          <Input id="pm-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {error && <p className="col-span-2 text-accent text-sm m-0">{error}</p>}
      </div>
    </Dialog>
  );
}
