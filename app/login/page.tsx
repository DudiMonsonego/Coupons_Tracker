import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">התחברות</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          התחבר/י עם Google כדי להמשיך. לאחר ההתחברות תוכל/י ליצור משק בית חדש או
          להצטרף למשק בית קיים עם קוד הזמנה.
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

