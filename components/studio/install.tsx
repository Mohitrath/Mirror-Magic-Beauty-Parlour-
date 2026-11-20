"use client";
import { useEffect, useState } from "react";
import { Dialog } from "./dialog";
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null),
    [show, setShow] = useState(false),
    [standalone, setStandalone] = useState(false),
    [device, setDevice] = useState<"ios" | "android" | "desktop">("desktop");
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const check = () =>
      setStandalone(
        mq.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
      );
    check();
    mq.addEventListener?.("change", check);
    const agent = navigator.userAgent.toLowerCase();
    setDevice(
      /iphone|ipad|ipod/.test(agent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
        ? "ios"
        : agent.includes("android")
          ? "android"
          : "desktop",
    );
    const capture = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const installed = () => {
      setPrompt(null);
      setStandalone(true);
      setShow(false);
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
    if ("serviceWorker" in navigator && window.isSecureContext)
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
    return () => {
      mq.removeEventListener?.("change", check);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  async function install() {
    if (!prompt) {
      setShow(true);
      return;
    }
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      setShow(true);
    } finally {
      setPrompt(null);
    }
  }
  if (standalone) return null;
  return (
    <>
      <button className="foot-install" onClick={install}>
        Install app
      </button>
      {show && (
        <Dialog
          kicker="MIRROR MAGIC"
          title="Install the app"
          onClose={() => setShow(false)}
        >
          <p className="dialog-intro">
            Keep Mirror Magic one tap away on your{" "}
            {device === "desktop" ? "desktop" : "home screen"}.
          </p>
          {device === "ios" ? (
            <ol className="install-steps">
              <li>Open this website in Safari.</li>
              <li>Tap Share, then Add to Home Screen.</li>
              <li>Choose Add to save Mirror Magic.</li>
            </ol>
          ) : device === "android" ? (
            <ol className="install-steps">
              <li>Open the website in your phone’s browser.</li>
              <li>
                Open the browser menu and choose Install app or Add to Home
                screen.
              </li>
              <li>Confirm to add the Mirror Magic icon.</li>
            </ol>
          ) : (
            <ol className="install-steps">
              <li>
                Open this website in a browser that supports app installation,
                such as Chrome or Edge.
              </li>
              <li>
                Use the install icon in the address bar or the install option in
                the browser menu.
              </li>
              <li>Confirm to open Mirror Magic in its own window.</li>
            </ol>
          )}
          <p className="muted">
            If you’re viewing an embedded preview, open the website in its own
            browser tab first.
          </p>
          <div className="dialog-buttons">
            <span />
            <button className="button primary" onClick={() => setShow(false)}>
              Done
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
