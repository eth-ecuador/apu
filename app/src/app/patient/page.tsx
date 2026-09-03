"use client";

import { redirect } from "next/navigation";

export default function PatientPage() {
  // Redirect to dashboard
  redirect("/patient/dashboard");
}
