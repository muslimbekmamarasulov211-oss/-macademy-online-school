import { Container, Section, SectionHeader } from "@/components/ui";
import { subjectCategories, subjects, subjectsAreSample } from "@/content/home";

import { CourseExplorer } from "./course-explorer";

export function Courses() {
  return (
    <Section id="kurslar" aria-labelledby="kurslar-heading" className="relative">
      <Container size="wide">
        <SectionHeader
          id="kurslar-heading"
          eyebrow="Kurslar"
          title={
            <>
              <span className="text-gold-foil">{subjects.length} ta fan</span> — bitta premium
              maktabda
            </>
          }
          description="Aniq va tabiiy fanlardan tillar va xalqaro imtihonlargacha. Yoʻnalishni tanlang va oʻzingizga mos kursni toping."
          sample={subjectsAreSample}
          sampleLabel="Namuna roʻyxat"
        />
        <CourseExplorer subjects={subjects} categories={subjectCategories} />
      </Container>
    </Section>
  );
}
