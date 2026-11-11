import type { Metadata } from "next";

import { ButtonLink, Container, Eyebrow, Heading, Text } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sahifa topilmadi",
};

export default function NotFound() {
  return (
    <Container size="narrow" className="flex flex-col items-center pt-44 pb-32 text-center">
      <Eyebrow>Xato 404</Eyebrow>
      <Heading level={1} size="xl" className="mt-5">
        Bunday sahifa mavjud emas
      </Heading>
      <Text size="lg" className="mt-5">
        Siz izlayotgan sahifa koʻchirilgan yoki hali yaratilmagan boʻlishi mumkin.
      </Text>
      <ButtonLink href="/" className="mt-10">
        Bosh sahifaga qaytish
      </ButtonLink>
    </Container>
  );
}
