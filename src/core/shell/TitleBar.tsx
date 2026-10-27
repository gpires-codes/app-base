import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { cn } from "@/lib/utils";
import { isMac, isTauri, platformKind } from "../platform";

function WinButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Windows/Linux: botões próprios. macOS: semáforo nativo (titleBarStyle Overlay), só o espaço de arrastar. */
export function TitleBar({ title }: { title?: string }) {
  const { t } = useTranslation();
  const [maximized, setMaximized] = useState(false);
  const enabled = isTauri && platformKind === "desktop";

  useEffect(() => {
    if (!enabled) return;
    const win = getCurrentWindow();
    const sync = () => void win.isMaximized().then(setMaximized);
    sync();
    const unlisten = win.onResized(sync);
    return () => {
      void unlisten.then((off) => off());
    };
  }, [enabled]);

  if (!enabled) return null;
  const win = getCurrentWindow();

  return (
    <header
      data-tauri-drag-region
      className="flex h-8 shrink-0 select-none items-center justify-between border-b bg-background text-sm"
    >
      <span
        data-tauri-drag-region
        className={cn(
          "flex-1 truncate px-3 text-muted-foreground",
          isMac && "pl-20",
        )}
      >
        {title}
      </span>
      {!isMac && (
        <div className="flex h-full">
          <WinButton
            label={t("window.minimize")}
            onClick={() => void win.minimize()}
          >
            <Minus className="size-4" />
          </WinButton>
          <WinButton
            label={t(maximized ? "window.restore" : "window.maximize")}
            onClick={() => void win.toggleMaximize()}
          >
            {maximized ? (
              <Copy className="size-3.5" />
            ) : (
              <Square className="size-3.5" />
            )}
          </WinButton>
          <WinButton
            label={t("window.close")}
            onClick={() => void win.close()}
            className="hover:bg-destructive hover:text-white"
          >
            <X className="size-4" />
          </WinButton>
        </div>
      )}
    </header>
  );
}
