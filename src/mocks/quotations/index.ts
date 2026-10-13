import type { QuotationSubjectKind } from "@/features/quotations";
import type { LocalizedText } from "@/i18n";

export interface RawQuotationSubject {
  readonly id: string;
  readonly kind: QuotationSubjectKind;
  readonly name: LocalizedText;
  readonly description: LocalizedText;
}

export const mockQuotationSubjects: readonly RawQuotationSubject[] = [
  {
    id: "quot-gym-equipment",
    kind: "gym-equipment",
    name: { en: "Gym equipment", ar: "معدات الصالات الرياضية" },
    description: {
      en: "Racks, platforms, cardio and free weights for a new or expanding facility.",
      ar: "رفوف ومنصات وأجهزة كارديو وأثقال حرة لصالة جديدة أو للتوسعة.",
    },
  },
  {
    id: "quot-facility",
    kind: "facility",
    name: { en: "Sports facility", ar: "منشأة رياضية" },
    description: {
      en: "Courts, pitches, flooring and fit-out for clubs and schools.",
      ar: "ملاعب وأرضيات وتجهيزات للأندية والمدارس.",
    },
  },
  {
    id: "quot-bulk-order",
    kind: "bulk-order",
    name: { en: "Large order", ar: "طلبية كبيرة" },
    description: {
      en: "Volume pricing on catalogue products for teams and federations.",
      ar: "أسعار جملة على منتجات المتجر للفرق والاتحادات.",
    },
  },
  {
    id: "quot-custom-equipment",
    kind: "custom-equipment",
    name: { en: "Custom equipment", ar: "معدات مخصّصة" },
    description: {
      en: "Branded or specification-built equipment.",
      ar: "معدات تحمل علامتكم أو مصنّعة حسب المواصفات.",
    },
  },
  {
    id: "quot-corporate",
    kind: "corporate",
    name: { en: "Corporate programme", ar: "برنامج للشركات" },
    description: {
      en: "Employee wellness, on-site training and coaching packages.",
      ar: "برامج صحة الموظفين والتدريب في الموقع وباقات التدريب.",
    },
  },
];
