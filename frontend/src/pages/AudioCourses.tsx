// Feature-flagged page — only rendered when the 'audioCourses' flag is enabled.
export default function AudioCourses() {
  return (
    <main className="min-h-screen bg-[#F9F6F0] px-4 py-16">
      <h1
        className="text-4xl font-bold text-[#B8963E] text-center"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Kursy audio
      </h1>
    </main>
  );
}
