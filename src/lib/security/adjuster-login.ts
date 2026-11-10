import { randomBytes, randomUUID } from "crypto";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { openMfaSecret, verifyTotp } from "@/lib/security/totp";
import type { StaffRole } from "@/lib/types";

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;
const IP_WINDOW_MINUTES = 15;
const IP_MAX_FAILURES = 25;

export const LOGIN_ERRORS = {
  invalid: "INVALID_CREDENTIALS",
  locked: "ACCOUNT_LOCKED",
  throttled: "TOO_MANY_ATTEMPTS",
  mfaRequired: "MFA_REQUIRED",
  mfaInvalid: "MFA_INVALID",
  passwordChangeRequired: "PASSWORD_CHANGE_REQUIRED",
  mfaSetupRequired: "MFA_SETUP_REQUIRED",
} as const;

export class LoginError extends Error {}

type RequestLike = { headers?: Record<string, unknown> | Headers } | undefined;

type AdjusterRow = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  licenseNumber: string | null;
  role: string;
  isActive: boolean;
  failedLoginCount: number;
  lockedUntil: Date | null;
  mustChangePassword: boolean;
  sessionVersion: number;
  mfaSecret: string | null;
  mfaEnabledAt: Date | null;
};

let dummy: Promise<string> | null = null;
function dummyHash() {
  dummy ??= hash("blackletter-timing-equalizer", 10);
  return dummy;
}

function header(req: RequestLike, name: string): string | null {
  const h = req?.headers;
  if (!h) return null;
  if (typeof (h as Headers).get === "function") return (h as Headers).get(name);
  const v = (h as Record<string, unknown>)[name];
  return Array.isArray(v) ? String(v[0]) : typeof v === "string" ? v : null;
}

function requestMeta(req: RequestLike) {
  const forwarded = header(req, "x-forwarded-for");
  return {
    ip: forwarded?.split(",")[0]?.trim() || header(req, "x-real-ip") || null,
    userAgent: header(req, "user-agent")?.slice(0, 300) ?? null,
  };
}

async function recordAuthEvent(opts: {
  email: string;
  event: string;
  adjusterId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  detail?: string | null;
}) {
  try {
    await prisma.$executeRaw`
      insert into public."AuthEvent"
        (id, "adjusterId", email, event, app, ip, "userAgent", detail, "createdAt")
      values (
        ${randomUUID()},
        ${opts.adjusterId ?? null},
        ${opts.email.toLowerCase()},
        ${opts.event},
        ${"BLACKLETTER"},
        ${opts.ip ?? null},
        ${opts.userAgent ?? null},
        ${opts.detail ?? null},
        now()
      )
    `;
  } catch (e) {
    console.error("[auth] failed to record auth event", e);
  }
}

async function findAdjuster(email: string): Promise<AdjusterRow | null> {
  const rows = await prisma.$queryRaw<AdjusterRow[]>`
    select id, name, email, "passwordHash", "licenseNumber", CAST(role AS text) as role,
           "isActive", "failedLoginCount", "lockedUntil", "mustChangePassword",
           "sessionVersion", "mfaSecret", "mfaEnabledAt"
    from public."Adjuster"
    where lower(email) = ${email}
    limit 1
  `;
  return rows[0] ?? null;
}

export async function adjusterSessionVersion(email: string): Promise<{
  sessionVersion: number;
  isActive: boolean;
} | null> {
  const rows = await prisma.$queryRaw<Array<{ sessionVersion: number; isActive: boolean }>>`
    select "sessionVersion", "isActive"
    from public."Adjuster"
    where lower(email) = ${email.toLowerCase()}
    limit 1
  `;
  return rows[0] ?? null;
}

/**
 * BLACKLETTER does not keep its own passwords. Lockout, MFA, and session
 * revocation are the BLACKBOX Adjuster row.
 */
export async function verifyAdjusterLogin(opts: {
  email: string;
  password: string;
  otp?: string | null;
  req?: RequestLike;
}) {
  const email = opts.email.toLowerCase().trim();
  const meta = requestMeta(opts.req);

  if (meta.ip) {
    const since = new Date(Date.now() - IP_WINDOW_MINUTES * 60_000);
    const counts = await prisma.$queryRaw<Array<{ count: bigint }>>`
      select CAST(count(*) AS bigint) as count
      from public."AuthEvent"
      where ip = ${meta.ip}
        and event in ('LOGIN_FAILURE', 'MFA_FAILURE')
        and "createdAt" >= ${since}
    `;
    if (Number(counts[0]?.count ?? 0) >= IP_MAX_FAILURES) {
      await recordAuthEvent({ email, event: "THROTTLED", ...meta });
      throw new LoginError(LOGIN_ERRORS.throttled);
    }
  }

  const adjuster = await findAdjuster(email);
  if (!adjuster || !adjuster.isActive) {
    await compare(opts.password, await dummyHash()).catch(() => false);
    await recordAuthEvent({
      email,
      event: "LOGIN_FAILURE",
      detail: adjuster ? "inactive" : "unknown",
      ...meta,
    });
    throw new LoginError(LOGIN_ERRORS.invalid);
  }

  if (adjuster.lockedUntil && new Date(adjuster.lockedUntil) > new Date()) {
    await recordAuthEvent({
      email,
      event: "LOGIN_FAILURE",
      adjusterId: adjuster.id,
      detail: "locked",
      ...meta,
    });
    throw new LoginError(LOGIN_ERRORS.locked);
  }

  const valid = await compare(opts.password, adjuster.passwordHash);
  if (!valid) {
    const failed = adjuster.failedLoginCount + 1;
    const lock = failed >= MAX_FAILED_LOGINS;
    await prisma.$executeRaw`
      update public."Adjuster"
      set "failedLoginCount" = ${lock ? 0 : failed},
          "lockedUntil" = ${lock ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : adjuster.lockedUntil}
      where id = ${adjuster.id}
    `;
    await recordAuthEvent({
      email,
      event: lock ? "LOCKED" : "LOGIN_FAILURE",
      adjusterId: adjuster.id,
      detail: lock ? `${MAX_FAILED_LOGINS} failed attempts` : "bad password",
      ...meta,
    });
    throw new LoginError(lock ? LOGIN_ERRORS.locked : LOGIN_ERRORS.invalid);
  }

  if (adjuster.mfaEnabledAt && adjuster.mfaSecret) {
    if (!opts.otp) throw new LoginError(LOGIN_ERRORS.mfaRequired);
    if (!verifyTotp(openMfaSecret(adjuster.mfaSecret), opts.otp)) {
      const failed = adjuster.failedLoginCount + 1;
      const lock = failed >= MAX_FAILED_LOGINS;
      await prisma.$executeRaw`
        update public."Adjuster"
        set "failedLoginCount" = ${lock ? 0 : failed},
            "lockedUntil" = ${lock ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : adjuster.lockedUntil}
        where id = ${adjuster.id}
      `;
      await recordAuthEvent({
        email,
        event: lock ? "LOCKED" : "MFA_FAILURE",
        adjusterId: adjuster.id,
        ...meta,
      });
      throw new LoginError(lock ? LOGIN_ERRORS.locked : LOGIN_ERRORS.mfaInvalid);
    }
  }

  const blocked = adjuster.mustChangePassword
    ? LOGIN_ERRORS.passwordChangeRequired
    : process.env.REQUIRE_ADMIN_MFA === "1" && adjuster.role === "ADMIN" && !adjuster.mfaEnabledAt
      ? LOGIN_ERRORS.mfaSetupRequired
      : null;
  if (blocked) {
    await prisma.$executeRaw`
      update public."Adjuster" set "failedLoginCount" = 0 where id = ${adjuster.id}
    `;
    await recordAuthEvent({
      email,
      event: "LOGIN_BLOCKED",
      adjusterId: adjuster.id,
      detail: blocked,
      ...meta,
    });
    throw new LoginError(blocked);
  }

  await prisma.$executeRaw`
    update public."Adjuster"
    set "failedLoginCount" = 0, "lockedUntil" = null, "lastLoginAt" = now()
    where id = ${adjuster.id}
  `;
  await recordAuthEvent({ email, event: "LOGIN_SUCCESS", adjusterId: adjuster.id, ...meta });
  return { ...adjuster, sessionVersion: Number(adjuster.sessionVersion) };
}

/** Staff rows are authorship records. They are not a second password database. */
export async function ensureStaffForAdjuster(adjuster: {
  email: string;
  name: string;
  role: string;
  licenseNumber: string | null;
}) {
  const email = adjuster.email.toLowerCase();
  const role = (["ADMIN", "ADJUSTER", "VIEWER"].includes(adjuster.role)
    ? adjuster.role
    : "ADJUSTER") as StaffRole;
  const existing = await prisma.staff.findUnique({ where: { email } });
  if (existing) {
    if (
      existing.name !== adjuster.name ||
      existing.role !== role ||
      existing.licenseNumber !== adjuster.licenseNumber ||
      !existing.isActive
    ) {
      return prisma.staff.update({
        where: { id: existing.id },
        data: {
          name: adjuster.name,
          role,
          licenseNumber: adjuster.licenseNumber,
          isActive: true,
        },
      });
    }
    return existing;
  }
  return prisma.staff.create({
    data: {
      email,
      name: adjuster.name,
      role,
      licenseNumber: adjuster.licenseNumber,
      isActive: true,
      passwordHash: await hash(randomBytes(32).toString("hex"), 10),
    },
  });
}
