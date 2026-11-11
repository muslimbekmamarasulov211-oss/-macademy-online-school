import { Container, Eyebrow, GoldRule, Heading, Section, Text } from "@/components/ui";

const steps = [
  { title: "Discover", body: "Find a programme that matches your goals and current level." },
  { title: "Learn", body: "Work through structured lessons at a pace that suits you." },
  { title: "Practise", body: "Apply what you learn and receive feedback on your work." },
  { title: "Progress", body: "See how far you have come and what comes next." },
] as const;

export function Journey() {
  return (
    <Section id="journey" aria-labelledby="journey-heading">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>
            <GoldRule />
            The learning journey
          </Eyebrow>
          <Heading id="journey-heading" className="mt-5">
            From first step to lasting progress
          </Heading>
          <Text size="lg" className="mt-5">
            This is the experience we are designing. Each stage will become available as the
            platform is built.
          </Text>
        </div>

        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-8">
          {steps.map((step, index) => (
            <li key={step.title} className="relative border-t border-border-strong pt-6">
              <span aria-hidden="true" className="absolute -top-px left-0 h-px w-10 bg-accent" />
              <p className="text-xs font-medium tracking-eyebrow text-subtle uppercase">
                Step {index + 1}
              </p>
              <Heading level={3} size="md" className="mt-3">
                {step.title}
              </Heading>
              <Text className="mt-3">{step.body}</Text>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
