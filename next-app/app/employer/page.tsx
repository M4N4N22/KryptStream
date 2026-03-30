export default function EmployerPage() {
  return (
    <main className="min-h-screen bg-[#f7f0de] px-6 py-16 text-stone-900">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-stone-900/10 bg-[#fffdf8] p-8 shadow-[0_20px_50px_rgba(54,43,26,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">TASK-008 next</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Employer dashboard scaffold ready</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-stone-600">
          Wallet connection and contract metadata are now wired. The next task will add deposit, allocation, and worker
          list flows on top of this route.
        </p>
      </div>
    </main>
  )
}
