import { Badge, Container, Heading, Section, Text } from "@/components/ui";

/**
 * Closing statement. Enrolment does not exist yet, so this deliberately has
 * no sign-up button — replace with a real CTA once enrolment is implemented.
 */
export function ClosingCta() {
  return (
    <Section className="pt-0 sm:pt-0 lg:pt-0" aria-labelledby="closing-heading">
      <Container size="narrow">
        <div className="relative overflow-hidden rounded-3xl border border-gold-400/25 bg-linear-to-b from-surface-raised to-surface px-6 py-14 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-gold-400/15 blur-3xl"
          />
          <Badge className="relative">Enrolment opening soon</Badge>
          <Heading id="closing-heading" size="xl" className="relative mt-6">
            Something considered is coming.
          </Heading>
          <Text size="lg" className="relative mx-auto mt-5 max-w-xl">
            Enrolment is not open yet. The platform is being built carefully, one verified step at a
            time.
          </Text>
        </div>
      </Container>
    </Section>
  );
}
