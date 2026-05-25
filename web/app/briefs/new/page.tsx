"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BriefEditor } from "../_editor";
import { createBrief, type Brief, type CampaignType, type Pace } from "@/lib/api";

export default function NewBriefPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(form: Partial<Brief>) {
    setSaving(true);
    setError("");
    try {
      const created = await createBrief({
        name: form.name || "",
        type: form.type as CampaignType,
        brief: form.brief,
        persona: form.persona,
        voice: form.voice,
        pace: form.pace as Pace,
      });
      router.push(`/briefs/${created.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return <BriefEditor title="New brief" saving={saving} error={error} onSave={save} />;
}
