import AboutChicken from "@/components/AboutChicken";
import Monitor from "@/components/Monitor";

// One screen, no page scroll: the monitor fills the viewport height,
// and "how it works / limits" lives behind the chicken button.
export default function Home() {
  return (
    <div className="mx-auto flex h-dvh min-h-[560px] w-full max-w-[1280px] flex-col px-4 sm:px-6">
      <main className="min-h-0 flex-1">
        <Monitor />
      </main>
      <AboutChicken />
    </div>
  );
}
