import { Card, Container, Eyebrow, GoldRule, Heading, Section, Text } from "@/components/ui";

const principles = [
  {
    title: "Structured learning",
    body: "Programmes are designed as clear paths, with defined outcomes for every stage.",
  },
  {
    title: "Considered teaching",
    body: "Quality of instruction comes first: clear explanations, purposeful practice and thoughtful feedback.",
  },
  {
    title: "International outlook",
    body: "Designed for learners in any country, with content and standards that travel with them.",
  },
  {
    title: "Focused by design",
    body: "A calm, distraction-free experience on any device, so attention stays on learning.",
  },
] as const;

export function Approach() {
  return (
    <Section id="approach" tone="surface" aria-labelledby="approach-heading">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>
            <GoldRule />
            Our approach
          </Eyebrow>
          <Heading id="approach-heading" className="mt-5">
            Built on four principles
          </Heading>
          <Text size="lg" className="mt-5">
            Every decision at M.ACADEMY — from curriculum to interface — is measured against these
            commitments.
          </Text>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:gap-6">
          {principles.map((principle, index) => (
            <li key={principle.title}>
              <Card className="h-full">
                <span aria-hidden="true" className="font-display text-3xl text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Heading level={3} size="sm" className="mt-4">
                  {principle.title}
                </Heading>
                <Text className="mt-3">{principle.body}</Text>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
