// Feature-flagged page — only rendered when the 'audioCourses' flag is enabled.
export default function AudioCourses() {
  return (
    <main className="min-h-screen bg-surface px-4 py-16">
      <h1
        className="text-4xl font-bold text-brand text-center"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        Kursy audio
      </h1>
    </main>
  );
}
