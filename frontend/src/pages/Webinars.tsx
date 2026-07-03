// Feature-flagged page — only rendered when the 'webinars' flag is enabled.
export default function Webinars() {
  return (
    <main className="min-h-screen bg-[#F9F6F0] px-4 py-16">
      <h1
        className="text-4xl font-bold text-[#B8963E] text-center"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        Webinary
      </h1>
    </main>
  );
}
