import type { ReactElement } from "react";

export default function Loading(): ReactElement {
  return (
    <section className="workflow-stack">
      <div className="card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div className="loading-spinner" />
        <p className="empty-row">Loading issues...</p>
      </div>
    </section>
  );
}
