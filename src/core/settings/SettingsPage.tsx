import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTr } from "../i18n";
import { isTauri, platformKind } from "../platform";
import { optionsOf, validatorOf } from "./engine";
import { useSettings } from "./SettingsProvider";
import type { Field, NumberField, PathField } from "./types";

interface CtlProps<F extends Field> {
  field: F;
  id: string;
  value: unknown;
  onChange: (v: unknown) => void;
}

function Control({ field, id, value, onChange }: CtlProps<Field>) {
  const tr = useTr();
  switch (field.type) {
    case "toggle":
      return <Switch id={id} checked={value === true} onCheckedChange={onChange} />;
    case "select":
      return (
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {optionsOf(field).map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {tr(o.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "text":
      return (
        <Input
          id={id}
          type={field.secret ? "password" : "text"}
          value={String(value)}
          placeholder={field.placeholder ? tr(field.placeholder) : undefined}
          maxLength={field.maxLength}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return <NumberInput field={field} id={id} value={value} onChange={onChange} />;
    case "path":
      return <PathInput field={field} id={id} value={value} onChange={onChange} />;
  }
}

function NumberInput({ field, id, value, onChange }: CtlProps<NumberField>) {
  const [draft, setDraft] = useState(String(value));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => setDraft(String(value)), [value]);
  return (
    <Input
      id={id}
      type="number"
      inputMode="decimal"
      value={draft}
      min={field.min}
      max={field.max}
      step={field.step}
      aria-invalid={invalid}
      onChange={(e) => {
        setDraft(e.target.value);
        const r = validatorOf(field).safeParse(e.target.value.trim() === "" ? NaN : Number(e.target.value));
        setInvalid(!r.success);
        if (r.success) onChange(r.data);
      }}
    />
  );
}

function PathInput({ field, id, value, onChange }: CtlProps<PathField>) {
  const { t } = useTranslation();
  async function pick() {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const res = await open({ directory: field.directory ?? false, multiple: false });
    if (typeof res === "string") onChange(res);
  }
  return (
    <div className="flex w-full gap-2">
      <Input id={id} value={String(value)} onChange={(e) => onChange(e.target.value)} />
      {isTauri && (
        <Button type="button" variant="outline" onClick={pick}>
          {t("settings.choose")}
        </Button>
      )}
    </div>
  );
}

function Row({ field }: { field: Field }) {
  const { values, set } = useSettings();
  const tr = useTr();
  const id = useId();
  return (
    <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <Label htmlFor={id}>{tr(field.label)}</Label>
        {field.description && <p className="mt-0.5 text-sm text-muted-foreground">{tr(field.description)}</p>}
      </div>
      <div className="flex sm:w-60 sm:shrink-0 sm:justify-end">
        <Control field={field} id={id} value={values[field.key]} onChange={(v) => set(field.key, v)} />
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const tr = useTr();
  const { schema, values, reset } = useSettings();
  const visible = (f: Field) =>
    (!f.platforms || f.platforms.includes(platformKind)) && (!f.visibleIf || f.visibleIf(values));

  return (
    <main className="mx-auto max-w-2xl px-5 py-6">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
      {schema.sections.map((sec) => {
        const fields = sec.fields.filter(visible);
        if (!fields.length) return null;
        return (
          <section key={sec.id} aria-labelledby={`sec-${sec.id}`} className="mt-8">
            <h2 id={`sec-${sec.id}`} className="mb-1 text-base font-semibold">
              {tr(sec.title)}
            </h2>
            <div className="divide-y border-y">
              {fields.map((f) => (
                <Row key={f.key} field={f} />
              ))}
            </div>
          </section>
        );
      })}
      <Button type="button" variant="outline" className="mt-8" onClick={reset}>
        {t("settings.reset")}
      </Button>
    </main>
  );
}
