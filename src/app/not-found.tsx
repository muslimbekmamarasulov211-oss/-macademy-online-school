import type { Metadata } from "next";

import { ButtonLink, Container, Eyebrow, Heading, Text } from "@/components/ui";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <Container size="narrow" className="flex flex-col items-center py-32 text-center">
      <Eyebrow>Error 404</Eyebrow>
      <Heading level={1} size="xl" className="mt-5">
        This page does not exist
      </Heading>
      <Text size="lg" className="mt-5">
        The page you are looking for may have moved, or has not been built yet.
      </Text>
      <ButtonLink href="/" className="mt-10">
        Return home
      </ButtonLink>
    </Container>
  );
}
