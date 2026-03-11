import { PrismaMariaDb } from "@prisma/adapter-mariadb";

type MariaDbPoolConfig = Exclude<ConstructorParameters<typeof PrismaMariaDb>[0], string>;
type NumericPoolOption =
  | "acquireTimeout"
  | "connectTimeout"
  | "connectionLimit"
  | "idleTimeout"
  | "minimumIdle"
  | "socketTimeout";

const NUMERIC_POOL_OPTIONS: NumericPoolOption[] = [
  "acquireTimeout",
  "connectTimeout",
  "connectionLimit",
  "idleTimeout",
  "minimumIdle",
  "socketTimeout",
];

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Add it to .env before initializing Prisma.");
  }

  return databaseUrl;
}

function readNumericPoolOption(
  searchParams: URLSearchParams,
  optionName: NumericPoolOption,
): number | null {
  const rawValue = searchParams.get(optionName);

  if (rawValue === null || rawValue.trim().length === 0) {
    return null;
  }

  const numericValue = Number(rawValue);

  if (!Number.isFinite(numericValue)) {
    throw new Error(`DATABASE_URL query parameter "${optionName}" must be a valid number.`);
  }

  return numericValue;
}

function createPoolConfig(databaseUrl: string): MariaDbPoolConfig {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid mysql:// or mariadb:// connection string.");
  }

  if (parsedUrl.protocol !== "mysql:" && parsedUrl.protocol !== "mariadb:") {
    throw new Error("DATABASE_URL must use the mysql:// or mariadb:// protocol.");
  }

  const database = decodeURIComponent(parsedUrl.pathname.replace(/^\//, ""));
  const poolConfig: MariaDbPoolConfig = {};

  if (parsedUrl.hostname) {
    poolConfig.host = parsedUrl.hostname;
  }

  if (parsedUrl.port) {
    poolConfig.port = Number(parsedUrl.port);
  }

  if (parsedUrl.username) {
    poolConfig.user = decodeURIComponent(parsedUrl.username);
  }

  if (parsedUrl.password) {
    poolConfig.password = decodeURIComponent(parsedUrl.password);
  }

  if (database) {
    poolConfig.database = database;
  }

  const socketPath = parsedUrl.searchParams.get("socketPath");
  if (socketPath !== null && socketPath.trim().length > 0) {
    poolConfig.socketPath = socketPath;
  }

  const timezone = parsedUrl.searchParams.get("timezone");
  if (timezone !== null && timezone.trim().length > 0) {
    poolConfig.timezone = timezone;
  }

  for (const optionName of NUMERIC_POOL_OPTIONS) {
    const numericValue = readNumericPoolOption(parsedUrl.searchParams, optionName);

    if (numericValue !== null) {
      poolConfig[optionName] = numericValue;
    }
  }

  return poolConfig;
}

export function createMariaDbAdapter() {
  return new PrismaMariaDb(createPoolConfig(getDatabaseUrl()));
}
