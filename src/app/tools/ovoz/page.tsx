import type { Metadata } from "next";

import { TtsStudio } from "@/components/sections/tools";
import { Container, Eyebrow, Heading, Text } from "@/components/ui";

/**
 * Internal tool: Uzbek text-to-speech via Aisha AI.
 * Deliberately not linked from the navigation and excluded from search engines.
 */
export const metadata: Metadata = {
  title: "Ovoz studiyasi",
  description: "Oʻzbekcha matnni ovozga aylantirish vositasi.",
  robots: { index: false, follow: false },
};

export default function VoiceToolPage() {
  return (
    <Container size="narrow" className="pt-36 pb-24 sm:pt-44">
      <Eyebrow>Ichki vosita · Text-to-Speech</Eyebrow>
      <Heading level={1} size="xl" className="mt-5">
        Ovoz studiyasi
      </Heading>
      <Text size="lg" className="mt-5">
        Oʻzbekcha matnni tabiiy ovozga aylantiring: kayfiyat va tezlikni tanlang, natijani WAV yoki
        MP3 formatida yuklab oling.
      </Text>
      <Text size="sm" tone="subtle" className="mt-3">
        Ovoz Aisha AI xizmatining “Gulnoza” modeli orqali yaratiladi. Har bir soʻrov xizmat
        balansidan foydalanadi.
      </Text>

      <div className="mt-10">
        <TtsStudio />
      </div>
    </Container>
  );
}
