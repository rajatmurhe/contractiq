import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ maxWidth: 640, margin: "12vh auto", padding: 24 }}>
      <h1>Page not found</h1>
      <p>Open ContractIQ to start a review or return to your workspace.</p>
      <Link href="/">Return to ContractIQ</Link>
    </main>
  );
}
