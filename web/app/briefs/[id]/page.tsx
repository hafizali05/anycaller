"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefEditor } from "../_editor";
import { getBrief, patchBrief, type Brief, type CampaignType, type Pace } from "@/lib/api";

export default function EditBriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setBrief(await getBrief(id));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function save(form: Partial<Brief>) {
    setSaving(true);
    setError("");
    try {
      const updated = await patchBrief(id, {
        name: form.name,
        type: form.type as CampaignType,
        brief: form.brief,
        persona: form.persona,
        voice: form.voice,
        pace: form.pace as Pace,
      });
      setBrief(updated);
      router.push("/briefs");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;
  return (
    <BriefEditor
      title={brief ? brief.name : "Brief not found"}
      initial={brief || undefined}
      saving={saving}
      error={error}
      onSave={save}
    />
  );
}
