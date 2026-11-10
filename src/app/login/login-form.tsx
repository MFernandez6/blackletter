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
import { BlacklineLogo } from "@/components/brand/blackline-mark";

type LoginValues = z.infer<typeof loginSchema>;

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Credentials rejected. Access denied.",
  ACCOUNT_LOCKED: "Too many failed attempts. This account is locked for 15 minutes — or ask an admin to unlock it in BLACKBOX.",
  TOO_MANY_ATTEMPTS: "Too many failed sign-ins from this network. Wait 15 minutes and retry.",
  MFA_INVALID: "Authenticator code rejected. Check the time on your phone and retry.",
  PASSWORD_CHANGE_REQUIRED: "Change this password in BLACKBOX before signing in here.",
  MFA_SETUP_REQUIRED: "Turn on an authenticator in BLACKBOX before signing in here.",
  CredentialsSignin: "Credentials rejected. Access denied.",
};

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
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otp, setOtp] = useState("");
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
      otp: needsOtp ? otp : "",
      redirect: false,
    });
    if (res?.error) {
      if (res.error === "MFA_REQUIRED") {
        setNeedsOtp(true);
        return;
      }
      setError(LOGIN_ERROR_MESSAGES[res.error] ?? LOGIN_ERROR_MESSAGES.INVALID_CREDENTIALS);
      if (res.error === "MFA_INVALID") setOtp("");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden px-5 py-12 sm:px-6">

      <div className="relative mx-auto flex w-full max-w-[21rem] animate-fade-up motion-reduce:animate-none flex-col items-center text-center sm:max-w-sm">
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

        <div className="mb-8 w-full border border-brand-gold/15 bg-brand-navy/40 px-4 py-6 rounded-2xl">
          <p className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-brand-slate">
            Operated for
          </p>
          <BlacklineLogo className="mx-auto mt-4 w-44" priority />
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
          {needsOtp ? (
            <div className="space-y-2">
              <Label htmlFor="otp">Authenticator code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
              <p className="text-xs text-brand-slate">Enter the 6-digit code from the authenticator you set up in BLACKBOX.</p>
            </div>
          ) : null}
          <Button
            type="submit"
            variant="solid"
            className="w-full"
            disabled={isSubmitting || (needsOtp && otp.length !== 6)}
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
