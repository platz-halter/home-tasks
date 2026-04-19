import { useState, useEffect } from "react";
import api from "@/lib/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePush() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported("serviceWorker" in navigator && "PushManager" in window);
    checkSubscription();
  }, []);

  async function checkSubscription() {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setSubscribed(!!sub);
  }

  async function subscribe() {
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const { data } = await api.get("/push/vapid-public-key");
      const applicationServerKey = urlBase64ToUint8Array(data.public_key);

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const json = sub.toJSON();
      await api.post("/push/subscribe", {
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      });

      setSubscribed(true);
    } catch (err: any) {
      setError(err.message ?? "Failed to subscribe");
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const json = sub.toJSON();
        await api.post("/push/unsubscribe", {
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err: any) {
      setError(err.message ?? "Failed to unsubscribe");
    } finally {
      setLoading(false);
    }
  }

  async function testPush() {
    await api.post("/push/test");
  }

  return {
    supported,
    subscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
    testPush,
  };
}
