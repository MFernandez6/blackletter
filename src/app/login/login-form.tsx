"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/schemas/login";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/ui/error-banner";
import { BlackletterMark } from "@/components/brand/blackletter-mark";
import { BlacklineMark } from "@/components/brand/blackline-mark";

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idleNotice = searchParams.get("reason") === "idle";
  const configError =
    searchParams.get("error") === "Configuration" ||
    searchParams.get("error") === "ServerError";
  const [error, setError] = useState(
    configError
      ? "Auth is missing NEXTAUTH_SECRET on the host. Set it in Vercel and redeploy."
      : ""
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginValues) {
    setError("");
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (res?.error) {
      setError("Credentials rejected. Access denied.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden px-5 py-12 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% -10%, rgba(232,184,74,0.1), transparent)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-[21rem] flex-col items-center text-center sm:max-w-sm">
        <div className="mb-8 flex w-full flex-col items-center">
          <p className="eyebrow mb-4">Contract & document generation</p>
          <BlackletterMark
            as="h1"
            className="font-serif text-[clamp(1.7rem,8vw,2.75rem)] font-bold tracking-[0.12em] text-brand-gold sm:tracking-[0.18em]"
          />
          <p className="mt-4 max-w-[18.5rem] text-sm leading-relaxed text-balance text-brand-white/80 sm:max-w-none">
            Letters of representation, PA contracts, and disclosure forms.
            Not a client portal.
          </p>
        </div>

        <div className="mb-8 w-full border border-brand-white/10 bg-brand-navy-deep/40 px-4 py-6">
          <p className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-brand-slate">
            Operated for
          </p>
          <div className="mt-4 flex flex-col items-center">
            <BlacklineMark size={52} className="text-brand-gold" />
            <p className="mt-4 font-serif text-sm font-semibold tracking-[0.28em] text-brand-gold">
              BLACKLINE
            </p>
            <div className="mt-2.5 h-px w-16 bg-brand-gold/70" />
            <p className="mt-2.5 font-serif text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-white/70">
              Public Adjusters LLC
            </p>
          </div>
        </div>

        <div className="hairline mb-8 w-full" />

        {idleNotice ? (
          <ErrorBanner
            message="Signed out after 5 minutes of inactivity. Sign in again to continue."
            className="mb-6 w-full text-left"
          />
        ) : null}

        {error ? (
          <ErrorBanner
            message={error}
            onDismiss={() => setError("")}
            className="mb-6 w-full text-left"
          />
        ) : null}

        <form
          method="post"
          action="#"
          onSubmit={handleSubmit(onSubmit)}
          className="w-full space-y-5 text-left"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-denied">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-xs text-denied">{errors.password.message}</p>
            ) : null}
          </div>
          <Button
            type="submit"
            variant="solid"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Authenticating…" : "Enter BLACKLETTER™"}
          </Button>
        </form>

        <p className="mt-8 text-center font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand-slate">
          Authorized personnel only · session encrypted
        </p>
      </div>
    </div>
  );
}
