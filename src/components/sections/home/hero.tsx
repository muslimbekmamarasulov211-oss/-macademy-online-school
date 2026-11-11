import { Badge, ButtonLink, Container, Eyebrow, GoldRule, Heading, Text } from "@/components/ui";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="hero-heading">
      {/* Decorative backdrop: gold glow + faint grid */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-20%] left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(177_192_221/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(177_192_221/0.05)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_top,black_30%,transparent_75%)] bg-size-[4rem_4rem]" />
      </div>

      <Container className="flex flex-col items-center pt-20 pb-24 text-center sm:pt-28 sm:pb-32 lg:pt-36 lg:pb-40">
        <Badge>
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          Platform in development
        </Badge>

        <Eyebrow className="mt-8">
          <GoldRule className="hidden rotate-180 sm:block" />
          International Online School
          <GoldRule className="hidden sm:block" />
        </Eyebrow>

        <Heading level={1} size="2xl" id="hero-heading" className="mt-6 max-w-4xl">
          Education of distinction, <span className="text-accent italic">without borders.</span>
        </Heading>

        <Text size="lg" className="mt-6 max-w-2xl">
          M.ACADEMY is building a premium online school for learners around the world — structured
          programmes, considered teaching and a calm, focused place to learn.
        </Text>

        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <ButtonLink href="/#approach" size="lg">
            Explore our approach
          </ButtonLink>
          <ButtonLink href="/#journey" size="lg" variant="secondary">
            See the learning journey
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
