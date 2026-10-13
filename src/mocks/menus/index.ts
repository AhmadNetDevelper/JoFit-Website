import type { RawMenu, RawMenuPage } from "../accounts/types";

/**
 * THE MENUS STAFF EDIT, AS THEY START.
 *
 * The "Courses" menu in the header and the pages its items open. Staff add,
 * remove, reorder and rewrite all of it in the admin (Content → Courses menu);
 * this is only the first state, and the text is the site's own published copy
 * (the /specialisations page and the header's labels) — nothing here is new
 * wording.
 *
 * The storefront and the admin start from the same copy of this file; with the
 * dev bridge running the storefront's copy wins. Deleted with the mocks at
 * go-live.
 */
export const seedMenus: readonly RawMenu[] = [
  {
    "key": "courses",
    "label": {
      "en": "Courses",
      "ar": "الدورات"
    },
    "href": "/education",
    "updatedAt": "2026-09-24T09:00:00+03:00",
    "groups": [
      {
        "id": "mg-certifications",
        "label": {
          "en": "NCSF certifications",
          "ar": "الاعتمادات الدولية"
        },
        "items": [
          {
            "id": "mi-cpt",
            "label": {
              "en": "Certified Personal Trainer (NCSF-CPT)",
              "ar": "المدرب الشخصي المعتمد"
            },
            "isVisible": true,
            "target": {
              "kind": "link",
              "href": "/education/courses/certified-personal-trainer"
            }
          },
          {
            "id": "mi-strength",
            "label": {
              "en": "Strength & Conditioning",
              "ar": "القوة والإعداد البدني"
            },
            "isVisible": true,
            "target": {
              "kind": "link",
              "href": "/education/courses/strength-and-conditioning-specialist"
            }
          },
          {
            "id": "mi-nutrition",
            "label": {
              "en": "Sports Nutrition",
              "ar": "التغذية الرياضية"
            },
            "isVisible": true,
            "target": {
              "kind": "link",
              "href": "/education/courses/sports-nutrition-specialist"
            }
          }
        ]
      },
      {
        "id": "mg-specialised",
        "label": {
          "en": "Specialised courses",
          "ar": "الدورات التخصصية"
        },
        "items": [
          {
            "id": "mi-rehab",
            "label": {
              "en": "Sports Injuries",
              "ar": "الإصابات الرياضية"
            },
            "isVisible": true,
            "target": {
              "kind": "link",
              "href": "/education/courses/sports-injury-prevention-and-rehabilitation"
            }
          },
          {
            "id": "mi-pilates",
            "label": {
              "en": "Reformer Pilates",
              "ar": "بيلاتس ريفورمر"
            },
            "isVisible": true,
            "target": {
              "kind": "link",
              "href": "/education/courses/professional-pilates-instructor"
            }
          },
          {
            "id": "mi-weightlifting",
            "label": {
              "en": "Olympic Weightlifting",
              "ar": "رفع الأثقال الأولمبية"
            },
            "isVisible": true,
            "target": {
              "kind": "link",
              "href": "/education/courses/olympic-weightlifting"
            }
          },
          {
            "id": "mi-ceu",
            "label": {
              "en": "CPD workshops (CEUs)",
              "ar": "ورش التطوير المهني (CEUs)"
            },
            "isVisible": true,
            "target": {
              "kind": "page",
              "pageId": "page-ceu"
            }
          }
        ]
      },
      {
        "id": "mg-browse",
        "label": {
          "en": "Browse",
          "ar": "تصفّح"
        },
        "items": [
          {
            "id": "mi-all",
            "label": {
              "en": "All courses",
              "ar": "كل الدورات"
            },
            "isVisible": true,
            "target": {
              "kind": "link",
              "href": "/education"
            }
          },
          {
            "id": "mi-specialisations",
            "label": {
              "en": "Specialisations",
              "ar": "التخصصات"
            },
            "isVisible": true,
            "target": {
              "kind": "link",
              "href": "/specialisations"
            }
          },
          {
            "id": "mi-nutrition-page",
            "label": {
              "en": "Nutrition",
              "ar": "التغذية"
            },
            "isVisible": true,
            "target": {
              "kind": "link",
              "href": "/nutrition"
            }
          },
          {
            "id": "mi-blog",
            "label": {
              "en": "Blog",
              "ar": "المدونة"
            },
            "isVisible": true,
            "target": {
              "kind": "link",
              "href": "/blog"
            }
          }
        ]
      }
    ]
  }
];

export const seedMenuPages: readonly RawMenuPage[] = [
  {
    "id": "page-cpt",
    "slug": "certified-personal-trainer",
    "eyebrow": {
      "en": "NCSF international certifications",
      "ar": "الاعتمادات الدولية من NCSF"
    },
    "title": {
      "en": "Certified Personal Trainer (NCSF-CPT)",
      "ar": "المدرب الشخصي المعتمد"
    },
    "summary": {
      "en": "A complete programme that brings together exercise science, assessment, programme design and hands-on practice, to qualify you to work in personal training.",
      "ar": "برنامج متكامل يجمع بين علوم التدريب، التقييم، تصميم البرامج، والتطبيق العملي لتأهيلك للعمل في مجال التدريب الشخصي."
    },
    "sections": [
      {
        "id": "page-cpt-agency",
        "heading": {
          "en": "Official agency",
          "ar": "وكالة رسمية حصرية"
        },
        "body": {
          "en": "That agency stands behind everything on this page: the certifications below are the council's own international programmes, JoFit delivers them here in Jordan, and the certificate a trainee finishes with is issued by the NCSF.",
          "ar": "هذه الوكالة هي الأساس الذي تقوم عليه كل دورة في هذه الصفحة: الاعتمادات أدناه برامج دولية يضعها المجلس نفسه، وتتولّى جوفِت تقديمها داخل الأردن، وتصدر الشهادة في نهايتها عن المجلس الوطني للقوة واللياقة البدنية."
        }
      },
      {
        "id": "page-cpt-ask",
        "heading": {
          "en": "Ask about a course",
          "ar": "استفسر عن الدورة المناسبة لك"
        },
        "body": {
          "en": "Course details are confirmed by JoFit directly. Tell us which qualification you have in mind and we will send you what applies to it, including the registration and refund conditions for that course.",
          "ar": "تفاصيل كل دورة تؤكّدها جوفِت مباشرة. أخبِرنا بالمؤهّل الذي تفكّر فيه ونرسل لك ما يخصّه، بما في ذلك شروط التسجيل واسترداد الرسوم الخاصة بتلك الدورة."
        }
      }
    ],
    "cta": {
      "label": {
        "en": "Contact JoFit",
        "ar": "تواصل مع جوفِت"
      },
      "href": "/contact"
    },
    "status": "published",
    "updatedAt": "2026-09-24T09:00:00+03:00"
  },
  {
    "id": "page-strength",
    "slug": "strength-and-conditioning-specialist",
    "eyebrow": {
      "en": "NCSF international certifications",
      "ar": "الاعتمادات الدولية من NCSF"
    },
    "title": {
      "en": "Strength & Conditioning",
      "ar": "القوة والإعداد البدني"
    },
    "summary": {
      "en": "A programme focused on developing the components of physical performance, such as strength, speed, endurance and power, and on building training programmes around the athlete's goals.",
      "ar": "برنامج يركّز على تطوير عناصر الأداء البدني، مثل القوة والسرعة والتحمل والقدرة، وبناء برامج تدريبية وفق أهداف الرياضي."
    },
    "sections": [
      {
        "id": "page-strength-agency",
        "heading": {
          "en": "Official agency",
          "ar": "وكالة رسمية حصرية"
        },
        "body": {
          "en": "That agency stands behind everything on this page: the certifications below are the council's own international programmes, JoFit delivers them here in Jordan, and the certificate a trainee finishes with is issued by the NCSF.",
          "ar": "هذه الوكالة هي الأساس الذي تقوم عليه كل دورة في هذه الصفحة: الاعتمادات أدناه برامج دولية يضعها المجلس نفسه، وتتولّى جوفِت تقديمها داخل الأردن، وتصدر الشهادة في نهايتها عن المجلس الوطني للقوة واللياقة البدنية."
        }
      },
      {
        "id": "page-strength-ask",
        "heading": {
          "en": "Ask about a course",
          "ar": "استفسر عن الدورة المناسبة لك"
        },
        "body": {
          "en": "Course details are confirmed by JoFit directly. Tell us which qualification you have in mind and we will send you what applies to it, including the registration and refund conditions for that course.",
          "ar": "تفاصيل كل دورة تؤكّدها جوفِت مباشرة. أخبِرنا بالمؤهّل الذي تفكّر فيه ونرسل لك ما يخصّه، بما في ذلك شروط التسجيل واسترداد الرسوم الخاصة بتلك الدورة."
        }
      }
    ],
    "cta": {
      "label": {
        "en": "Contact JoFit",
        "ar": "تواصل مع جوفِت"
      },
      "href": "/contact"
    },
    "status": "published",
    "updatedAt": "2026-09-24T09:00:00+03:00"
  },
  {
    "id": "page-nutrition",
    "slug": "sports-nutrition-specialist",
    "eyebrow": {
      "en": "NCSF international certifications",
      "ar": "الاعتمادات الدولية من NCSF"
    },
    "title": {
      "en": "Sports Nutrition",
      "ar": "التغذية الرياضية"
    },
    "summary": {
      "en": "A programme that connects nutrition with athletic performance and body composition, and gives you a practical foundation for understanding your clients' needs and supporting their goals.",
      "ar": "برنامج يربط بين التغذية والأداء الرياضي وتكوين الجسم، ويمنحك أساسًا عمليًا لفهم احتياجات المتدربين ودعم أهدافهم."
    },
    "sections": [
      {
        "id": "page-nutrition-agency",
        "heading": {
          "en": "Official agency",
          "ar": "وكالة رسمية حصرية"
        },
        "body": {
          "en": "That agency stands behind everything on this page: the certifications below are the council's own international programmes, JoFit delivers them here in Jordan, and the certificate a trainee finishes with is issued by the NCSF.",
          "ar": "هذه الوكالة هي الأساس الذي تقوم عليه كل دورة في هذه الصفحة: الاعتمادات أدناه برامج دولية يضعها المجلس نفسه، وتتولّى جوفِت تقديمها داخل الأردن، وتصدر الشهادة في نهايتها عن المجلس الوطني للقوة واللياقة البدنية."
        }
      },
      {
        "id": "page-nutrition-ask",
        "heading": {
          "en": "Ask about a course",
          "ar": "استفسر عن الدورة المناسبة لك"
        },
        "body": {
          "en": "Course details are confirmed by JoFit directly. Tell us which qualification you have in mind and we will send you what applies to it, including the registration and refund conditions for that course.",
          "ar": "تفاصيل كل دورة تؤكّدها جوفِت مباشرة. أخبِرنا بالمؤهّل الذي تفكّر فيه ونرسل لك ما يخصّه، بما في ذلك شروط التسجيل واسترداد الرسوم الخاصة بتلك الدورة."
        }
      }
    ],
    "cta": {
      "label": {
        "en": "Contact JoFit",
        "ar": "تواصل مع جوفِت"
      },
      "href": "/contact"
    },
    "status": "published",
    "updatedAt": "2026-09-24T09:00:00+03:00"
  },
  {
    "id": "page-rehab",
    "slug": "sports-injury-prevention-and-rehabilitation",
    "eyebrow": {
      "en": "Specialised courses",
      "ar": "الدورات التخصصية"
    },
    "title": {
      "en": "Sports Injuries",
      "ar": "الإصابات الرياضية"
    },
    "summary": {
      "en": "Specialised training in understanding sports injuries: how they happen, how to deal with them, and the principles of rehabilitation and returning to training.",
      "ar": "تدريب متخصص لفهم الإصابات الرياضية، آليات حدوثها، طرق التعامل معها، ومبادئ التأهيل والعودة إلى التدريب."
    },
    "sections": [
      {
        "id": "page-rehab-agency",
        "heading": {
          "en": "Official agency",
          "ar": "وكالة رسمية حصرية"
        },
        "body": {
          "en": "That agency stands behind everything on this page: the certifications below are the council's own international programmes, JoFit delivers them here in Jordan, and the certificate a trainee finishes with is issued by the NCSF.",
          "ar": "هذه الوكالة هي الأساس الذي تقوم عليه كل دورة في هذه الصفحة: الاعتمادات أدناه برامج دولية يضعها المجلس نفسه، وتتولّى جوفِت تقديمها داخل الأردن، وتصدر الشهادة في نهايتها عن المجلس الوطني للقوة واللياقة البدنية."
        }
      },
      {
        "id": "page-rehab-ask",
        "heading": {
          "en": "Ask about a course",
          "ar": "استفسر عن الدورة المناسبة لك"
        },
        "body": {
          "en": "Course details are confirmed by JoFit directly. Tell us which qualification you have in mind and we will send you what applies to it, including the registration and refund conditions for that course.",
          "ar": "تفاصيل كل دورة تؤكّدها جوفِت مباشرة. أخبِرنا بالمؤهّل الذي تفكّر فيه ونرسل لك ما يخصّه، بما في ذلك شروط التسجيل واسترداد الرسوم الخاصة بتلك الدورة."
        }
      }
    ],
    "cta": {
      "label": {
        "en": "Contact JoFit",
        "ar": "تواصل مع جوفِت"
      },
      "href": "/contact"
    },
    "status": "published",
    "updatedAt": "2026-09-24T09:00:00+03:00"
  },
  {
    "id": "page-pilates",
    "slug": "professional-pilates-instructor",
    "eyebrow": {
      "en": "Specialised courses",
      "ar": "الدورات التخصصية"
    },
    "title": {
      "en": "Reformer Pilates",
      "ar": "بيلاتس ريفورمر"
    },
    "summary": {
      "en": "A programme that combines knowledge with hands-on practice to develop your skills on the Reformer, and your understanding of movement, alignment, posture and the core.",
      "ar": "برنامج يجمع بين المعرفة والتطبيق العملي لتطوير مهارات استخدام الـReformer، وفهم الحركة، الـAlignment، الـPosture، والـCore."
    },
    "sections": [
      {
        "id": "page-pilates-agency",
        "heading": {
          "en": "Official agency",
          "ar": "وكالة رسمية حصرية"
        },
        "body": {
          "en": "That agency stands behind everything on this page: the certifications below are the council's own international programmes, JoFit delivers them here in Jordan, and the certificate a trainee finishes with is issued by the NCSF.",
          "ar": "هذه الوكالة هي الأساس الذي تقوم عليه كل دورة في هذه الصفحة: الاعتمادات أدناه برامج دولية يضعها المجلس نفسه، وتتولّى جوفِت تقديمها داخل الأردن، وتصدر الشهادة في نهايتها عن المجلس الوطني للقوة واللياقة البدنية."
        }
      },
      {
        "id": "page-pilates-ask",
        "heading": {
          "en": "Ask about a course",
          "ar": "استفسر عن الدورة المناسبة لك"
        },
        "body": {
          "en": "Course details are confirmed by JoFit directly. Tell us which qualification you have in mind and we will send you what applies to it, including the registration and refund conditions for that course.",
          "ar": "تفاصيل كل دورة تؤكّدها جوفِت مباشرة. أخبِرنا بالمؤهّل الذي تفكّر فيه ونرسل لك ما يخصّه، بما في ذلك شروط التسجيل واسترداد الرسوم الخاصة بتلك الدورة."
        }
      }
    ],
    "cta": {
      "label": {
        "en": "Contact JoFit",
        "ar": "تواصل مع جوفِت"
      },
      "href": "/contact"
    },
    "status": "published",
    "updatedAt": "2026-09-24T09:00:00+03:00"
  },
  {
    "id": "page-ceu",
    "slug": "cpd-workshops",
    "eyebrow": {
      "en": "Specialised courses",
      "ar": "الدورات التخصصية"
    },
    "title": {
      "en": "Continuing professional development workshops (CEUs)",
      "ar": "ورش العمل للتطوير المهني المستمر (CEUs)"
    },
    "summary": {
      "en": "Short workshops carrying continuing education units, for professionals who want to keep building on a qualification they already hold.",
      "ar": "ورش قصيرة تمنح وحدات تعليم مستمر، لمن يريد مواصلة البناء على مؤهّل يحمله بالفعل."
    },
    "sections": [
      {
        "id": "page-ceu-agency",
        "heading": {
          "en": "Official agency",
          "ar": "وكالة رسمية حصرية"
        },
        "body": {
          "en": "That agency stands behind everything on this page: the certifications below are the council's own international programmes, JoFit delivers them here in Jordan, and the certificate a trainee finishes with is issued by the NCSF.",
          "ar": "هذه الوكالة هي الأساس الذي تقوم عليه كل دورة في هذه الصفحة: الاعتمادات أدناه برامج دولية يضعها المجلس نفسه، وتتولّى جوفِت تقديمها داخل الأردن، وتصدر الشهادة في نهايتها عن المجلس الوطني للقوة واللياقة البدنية."
        }
      },
      {
        "id": "page-ceu-ask",
        "heading": {
          "en": "Ask about a course",
          "ar": "استفسر عن الدورة المناسبة لك"
        },
        "body": {
          "en": "Course details are confirmed by JoFit directly. Tell us which qualification you have in mind and we will send you what applies to it, including the registration and refund conditions for that course.",
          "ar": "تفاصيل كل دورة تؤكّدها جوفِت مباشرة. أخبِرنا بالمؤهّل الذي تفكّر فيه ونرسل لك ما يخصّه، بما في ذلك شروط التسجيل واسترداد الرسوم الخاصة بتلك الدورة."
        }
      }
    ],
    "cta": {
      "label": {
        "en": "Contact JoFit",
        "ar": "تواصل مع جوفِت"
      },
      "href": "/contact"
    },
    "status": "published",
    "updatedAt": "2026-09-24T09:00:00+03:00"
  }
];
