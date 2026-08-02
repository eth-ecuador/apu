import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  privyId: text("privy_id").unique(),

  // Sepolia transaction hashes
  sepoliaSubmitTx: text("sepolia_submit_tx"),
  sepoliaDiagnosisTx: text("sepolia_diagnosis_tx"),

  // 0G Storage references
  ogStorageRoot: text("og_storage_root"),
  encryptedDataCipher: text("encrypted_data_cipher"),  // Local backup

  // Metadata
  hasData: boolean("has_data").default(false),
  diagnosed: boolean("diagnosed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const diagnoses = pgTable("diagnoses", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),

  // 0G Compute references
  ogComputeRequestId: text("og_compute_request_id"),
  teeSignature: text("tee_signature"),

  // AI results (encrypted on-chain, metadata here)
  diagnosisMetadata: text("diagnosis_metadata"),  // JSON metadata
  confidence: text("confidence"),

  // Timestamps
  requestedAt: timestamp("requested_at").defaultNow(),
  completedAt: timestamp("completed_at")
});

export const doctors = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  privyId: text("privy_id").unique(),
  name: text("name"),
  specialty: text("specialty"),
  authorized: boolean("authorized").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
