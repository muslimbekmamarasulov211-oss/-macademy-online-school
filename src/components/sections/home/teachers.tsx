import { Container, Section, SectionHeader } from "@/components/ui";
import { teachers, teachersAreSample } from "@/content/home";

import { TeacherCarousel } from "./teacher-carousel";

export function Teachers() {
  return (
    <Section id="ustozlar" aria-labelledby="ustozlar-heading">
      <Container size="wide">
        <SectionHeader
          id="ustozlar-heading"
          eyebrow="Ustozlar"
          title="Oʻz sohasining ustalari"
          description="Har bir ustoz — fanini chuqur biladigan va uni tushunarli yetkaza oladigan mutaxassis. Tanishing."
          sample={teachersAreSample}
          sampleLabel="Namuna ustozlar"
        />
        <TeacherCarousel teachers={teachers} sample={teachersAreSample} />
      </Container>
    </Section>
  );
}
