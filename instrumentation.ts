export async function register(): Promise<void> {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    const { startEmailQueueProcessor } = await import("./services/background-jobs");
    startEmailQueueProcessor();
  }
}
