#!/usr/bin/env tsx
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync, readdirSync } from "fs";
import { Client } from "basic-ftp";

// Load .env.local from project root
config({ path: resolve(process.cwd(), ".env.local") });

// --- T005: FtpConfig interface and loadConfig() ---

interface FtpConfig {
  host: string;
  user: string;
  password: string;
  remoteDir: string;
}

function loadConfig(): FtpConfig {
  return {
    host: process.env.FTP_HOST ?? "",
    user: process.env.FTP_USER ?? "",
    password: process.env.FTP_PASS ?? "",
    remoteDir: process.env.FTP_REMOTE_DIR || "/",
  };
}

// --- T006: validateConfig() ---

function validateConfig(cfg: FtpConfig): void {
  const required: { key: keyof FtpConfig; envName: string }[] = [
    { key: "host", envName: "FTP_HOST" },
    { key: "user", envName: "FTP_USER" },
    { key: "password", envName: "FTP_PASS" },
  ];

  const missing = required
    .filter(({ key }) => !cfg[key])
    .map(({ envName }) => envName);

  if (missing.length > 0) {
    console.error(
      `Error: Missing required environment variable(s): ${missing.join(", ")}`,
    );
    console.error("Add them to .env.local or set them in your environment.");
    process.exit(1);
  }
}

// --- T007: validateBuildOutput() ---

const BUILD_DIR = resolve(process.cwd(), "out");

function validateBuildOutput(): void {
  if (!existsSync(BUILD_DIR)) {
    console.error(`Error: Build output directory not found: ${BUILD_DIR}`);
    console.error('Run "npm run export" first to build the site.');
    process.exit(1);
  }

  const entries = readdirSync(BUILD_DIR);
  if (entries.length === 0) {
    console.error(`Error: Build output directory is empty: ${BUILD_DIR}`);
    console.error('Run "npm run export" first to build the site.');
    process.exit(1);
  }
}

// --- T008: connectFtp() ---

async function connectFtp(cfg: FtpConfig): Promise<Client> {
  const client = new Client();

  // Try FTPS first
  try {
    await client.access({
      host: cfg.host,
      user: cfg.user,
      password: cfg.password,
      secure: true,
    });
    console.log(`Connected to ${cfg.host} via FTPS (TLS)`);
    return client;
  } catch {
    console.log("FTPS connection failed, falling back to plain FTP...");
  }

  // Fallback to plain FTP
  try {
    await client.access({
      host: cfg.host,
      user: cfg.user,
      password: cfg.password,
      secure: false,
    });
    console.log(`Connected to ${cfg.host} via plain FTP`);
    return client;
  } catch (err) {
    console.error(`Error: Failed to connect to FTP server ${cfg.host}`);
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

// --- T009: uploadSite() ---

async function uploadSite(client: Client, remoteDir: string): Promise<number> {
  let fileCount = 0;

  client.trackProgress((info) => {
    if (info.type === "upload" && info.name) {
      fileCount++;
      console.log(`  Uploading: ${info.name}`);
    }
  });

  console.log(`\nUploading ${BUILD_DIR} → ${remoteDir}`);
  await client.uploadFromDir(BUILD_DIR, remoteDir);

  client.trackProgress(); // stop tracking
  return fileCount;
}

// --- T010: main() ---

async function main(): Promise<void> {
  const startTime = Date.now();

  console.log("=== FTP Deploy ===\n");

  // 1. Load and validate config
  const cfg = loadConfig();
  validateConfig(cfg);

  // 2. Validate build output
  validateBuildOutput();
  console.log(`Build output found: ${BUILD_DIR}`);

  // 3. Connect to FTP
  const client = await connectFtp(cfg);

  // 4. Upload
  let fileCount = 0;
  try {
    fileCount = await uploadSite(client, cfg.remoteDir);
  } catch (err) {
    console.error("\nError: Upload failed");
    console.error(err instanceof Error ? err.message : String(err));
    client.close();
    process.exit(1);
  }

  // 5. Summary
  client.close();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✓ Deploy complete!`);
  console.log(`  Files uploaded: ${fileCount}`);
  console.log(`  Duration: ${duration}s`);
  console.log(`  Remote directory: ${cfg.remoteDir}`);
}

main();
