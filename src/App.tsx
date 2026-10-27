import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { settingsSchema } from "@/app/settings.schema";
import { useLanguage } from "@/core/i18n";
import { TitleBar } from "@/core/shell/TitleBar";
import { SettingsPage } from "@/core/settings/SettingsPage";
import { SettingsProvider, useSetting } from "@/core/settings/SettingsProvider";
import { useTheme } from "@/core/theme";
import { useSystemIntegration } from "./core/shell/useSystemIntegration";

function Shell() {
  const { t } = useTranslation();
  const [page, setPage] = useState<"home" | "settings">("home");
  useSystemIntegration();
  useTheme(useSetting<string>("theme"));
  useLanguage(useSetting<string>("language"));

  return (
    <div className="flex h-screen flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-foreground">
      <TitleBar title="app-base" />

      <nav className="flex gap-1 border-b px-3 py-2 glass">
        <Button
          size="sm"
          variant={page === "home" ? "secondary" : "ghost"}
          onClick={() => setPage("home")}
        >
          {t("nav.home")}
        </Button>

        <Button
          size="sm"
          variant={page === "settings" ? "secondary" : "ghost"}
          onClick={() => setPage("settings")}
        >
          {t("nav.settings")}
        </Button>
      </nav>

      <div className="flex-1 app-scrollbar">
        {page === "home" ? (
          <main className="mx-auto max-w-2xl px-5 py-6">
            <h1 className="text-2xl font-semibold">{t("home.title")}</h1>
          </main>
        ) : (
          <SettingsPage />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider schema={settingsSchema}>
      <Shell />
    </SettingsProvider>
  );
}
