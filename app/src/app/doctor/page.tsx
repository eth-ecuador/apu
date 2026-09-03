"use client";

import { redirect } from "next/navigation";

export default function DoctorPage() {
  // Redirect to dashboard
  redirect("/doctor/dashboard");
}
