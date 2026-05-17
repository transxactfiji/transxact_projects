import { Loader2 } from "lucide-react";

export function Spinner() {
  return <Loader2 className="animate-spin text-primary" size={24} />;
}

export function Loading({ label }: { label: string }) {
  return (
    <section className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <div className="border rounded-lg bg-card shadow-card text-center py-12 px-4">
        <div className="mb-3">
          <Loader2 className="animate-spin text-primary mx-auto" size={28} />
        </div>
        <p className="text-muted-foreground text-sm text-center">{label}</p>
      </div>
    </section>
  );
}
