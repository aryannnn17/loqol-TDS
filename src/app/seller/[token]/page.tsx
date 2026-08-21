import { notFound } from "next/navigation";
import { SellerDisclosureApp } from "@/components/seller-disclosure-app";
import { getDealStateByToken } from "@/lib/disclosure-store";
import { serializeSellerState } from "@/lib/seller-state";

export default async function SellerDashboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const state = await getDealStateByToken(token);

  if (!state) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,190,95,0.18),_transparent_28%),linear-gradient(180deg,#fffdf8_0%,#f7f1e6_50%,#f3eee4_100%)]">
      <SellerDisclosureApp token={token} initialState={serializeSellerState(state)} />
    </main>
  );
}
