import { formatInr, formatWhen, paymentMethod } from "../lib/money";

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[0.68rem] tracking-[0.16em] text-gold uppercase">{label}</dt>
      <dd className="mt-1 text-sm break-all">{value}</dd>
    </div>
  );
}

export default function InvoiceSheet({ invoice }) {
  const paid = invoice.status === "PAID";
  const method = paymentMethod(invoice);

  return (
    <article className="border border-line bg-white text-ink">
      <header className="flex flex-wrap items-end justify-between gap-6 bg-pine-deep px-5 py-8 text-paper sm:px-10">
        <div>
          <p className="text-[0.68rem] tracking-[0.22em] text-gold uppercase">Keyrank Solutions</p>
          <h2 className="mt-2 font-serif text-5xl">{paid ? "Invoice" : "Payment receipt"}</h2>
        </div>
        <div className="sm:text-right">
          <p className="font-serif text-3xl">{invoice.number}</p>
          <p className={`mt-2 text-xs tracking-[0.16em] uppercase ${paid ? "text-gold" : "text-[#e7b2ab]"}`}>
            {paid ? "Paid" : "Declined"}
          </p>
        </div>
      </header>

      <div className="grid gap-8 px-5 py-8 sm:grid-cols-2 sm:px-10">
        <div>
          <p className="text-[0.68rem] tracking-[0.16em] text-gold uppercase">Billed to</p>
          <p className="mt-2 font-serif text-4xl break-words">{invoice.vendorName}</p>
          {invoice.companyName ? <p className="mt-2 text-sm">{invoice.companyName}</p> : null}
          <p className="mt-1 text-sm text-ink/70">{invoice.phone}</p>
          {invoice.email ? <p className="text-sm text-ink/70">{invoice.email}</p> : null}
          {invoice.username ? <p className="text-sm text-ink/70">@{invoice.username}</p> : null}
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Row label="Date" value={formatWhen(invoice.paidAt || invoice.createdAt)} />
          <Row label="Order id" value={invoice.orderId} />
          <Row label="Payment id" value={invoice.paymentId} />
          <Row label="Method" value={method} />
        </dl>
      </div>

      <div className="mx-5 border-t border-line sm:mx-10" />

      <div className="flex flex-wrap items-end justify-between gap-6 px-5 py-8 sm:px-10">
        <div>
          <p className="text-[0.68rem] tracking-[0.16em] text-gold uppercase">Plan</p>
          <p className="mt-2 font-serif text-4xl break-words">{invoice.planName}</p>
          {invoice.note ? <p className="mt-3 max-w-md text-sm leading-6 text-clay">{invoice.note}</p> : null}
        </div>
        <div className="sm:text-right">
          <p className="text-[0.68rem] tracking-[0.16em] text-ink/45 uppercase">Amount</p>
          <p className="mt-1 font-serif text-5xl text-gold">{formatInr(invoice.amount)}</p>
        </div>
      </div>
    </article>
  );
}
