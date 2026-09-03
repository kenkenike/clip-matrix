import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";

export const metadata: Metadata = {
  title: "Help – Moderator – Clip Matrix",
};

export default function ModHelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          Moderator Help
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Guidelines for reviewing clip submissions.
        </p>
      </div>

      <div className="rounded-none border border-line bg-surface p-6 space-y-5">
        <div className="flex items-start gap-3">
          <LifeBuoy className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-sm font-semibold text-fg">Your role</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              As a moderator you can review creator clip submissions. Open a clip from the
              Submissions queue, check the content, and approve, reject, flag, or request
              changes. Your decisions directly affect creator payouts.
            </p>
          </div>
        </div>

        <div className="border-t border-line pt-5">
          <h3 className="text-sm font-semibold text-fg">Review guidelines</h3>
          <ul className="mt-2 space-y-2 text-sm text-muted">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="text-fg">Approve</strong> — clip meets all campaign requirements, content is appropriate, and engagement looks genuine.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
              <span><strong className="text-fg">Reject</strong> — clip violates campaign rules, contains prohibited content, or fails quality standards. Always provide a rejection reason so the creator knows what to fix.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />
              <span><strong className="text-fg">Flag</strong> — clip looks suspicious or needs a second opinion. Flagged clips go to the fraud detection queue for further analysis.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <span><strong className="text-fg">Request Changes</strong> — clip is close but needs minor adjustments. The clip goes back to under review status.</span>
            </li>
          </ul>
        </div>

        <div className="border-t border-line pt-5">
          <h3 className="text-sm font-semibold text-fg">Need more help?</h3>
          <p className="mt-1 text-sm text-muted">
            Contact the admin team at <span className="font-medium text-fg">admin@clipmatrix.co</span> for
            escalation or questions about specific submissions.
          </p>
        </div>
      </div>
    </div>
  );
}
