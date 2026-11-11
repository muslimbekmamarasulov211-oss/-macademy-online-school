import { NiginaLauncher } from "@/components/layout";
import {
  About,
  Contact,
  Courses,
  EnrollCta,
  Hero,
  Journey,
  KoreanCourse,
  NiginaShowcase,
  Results,
  SubjectMarquee,
  Teachers,
} from "@/components/sections/home";

export default function HomePage() {
  return (
    <>
      <Hero />
      <SubjectMarquee />
      <Courses />
      <KoreanCourse />
      <Teachers />
      <Results />
      <Journey />
      <About />
      <NiginaShowcase />
      <EnrollCta />
      <Contact />
      <NiginaLauncher />
    </>
  );
}
