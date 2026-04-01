export function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://askzev.ai/#organization',
        name: 'zev.ai',
        url: 'https://askzev.ai',
        description: 'Custom AI systems for businesses, freelancers, and individuals. Real implementation, real results.',
        founder: { '@id': 'https://askzev.ai/#person' },
        sameAs: [
          'https://github.com/zev330-lab',
          'https://www.linkedin.com/in/zevsteinmetz',
        ],
      },
      {
        '@type': 'Person',
        '@id': 'https://askzev.ai/#person',
        name: 'Zev Steinmetz',
        jobTitle: 'AI Implementation Consultant',
        url: 'https://askzev.ai/about',
        worksFor: { '@id': 'https://askzev.ai/#organization' },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Newton',
          addressRegion: 'MA',
          addressCountry: 'US',
        },
        knowsAbout: [
          'Artificial Intelligence',
          'Multi-Agent Systems',
          'AI Implementation',
          'Business Automation',
          'Real Estate Technology',
          'AI Consulting',
          'Production AI Systems',
        ],
        sameAs: [
          'https://github.com/zev330-lab',
          'https://www.linkedin.com/in/zevsteinmetz',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://askzev.ai/#website',
        url: 'https://askzev.ai',
        name: 'zev.ai',
        publisher: { '@id': 'https://askzev.ai/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://askzev.ai/blog?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': ['ProfessionalService', 'LocalBusiness'],
        '@id': 'https://askzev.ai/#business',
        name: 'zev.ai — AI Implementation Consulting',
        provider: { '@id': 'https://askzev.ai/#organization' },
        description: 'Custom AI systems built and deployed for businesses and individuals. From first conversation through full implementation and ongoing support.',
        url: 'https://askzev.ai',
        email: 'hello@askzev.ai',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Newton',
          addressRegion: 'MA',
          addressCountry: 'US',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 42.337,
          longitude: -71.209,
        },
        areaServed: { '@type': 'Country', name: 'United States' },
        priceRange: '$$$',
        image: 'https://askzev.ai/api/og/social?text=Custom%20AI%20systems%20that%20actually%20work&pillar=zev.ai&format=landscape&style=blog',
        sameAs: [
          'https://github.com/zev330-lab',
          'https://www.linkedin.com/in/zevsteinmetz',
        ],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'AI Consulting Services',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Free AI Summary',
                description: 'Tell us about your situation and get a clear picture of where AI could actually help. Free, no commitment.',
                url: 'https://askzev.ai/services',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'AI System Build',
                description: 'Design, build, and deploy custom AI systems integrated into your operations. Automated workflows, real-time monitoring, and 30 days post-launch support. Starting from $15,000.',
                url: 'https://askzev.ai/services',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Ongoing Partnership',
                description: 'Continuous system improvements, performance monitoring, and new capabilities. Month-to-month, no lock-in. Starting from $2,500/month.',
                url: 'https://askzev.ai/services',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Custom Apps',
                description: 'Focused tools built for your exact use case — personal, professional, or business. Web or mobile. Starting from $1,000.',
                url: 'https://askzev.ai/services',
              },
            },
          ],
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function HomeFaqSchema() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'I\'m not a business. Can this help me?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Zev works with individuals, families, freelancers, students — anyone who has something in their life that repeats itself and shouldn\'t have to. Personal projects welcome.',
        },
      },
      {
        '@type': 'Question',
        name: 'What kind of things can you build?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Custom apps, automated workflows, dashboards, research tools, content systems, personal assistants — anything where AI can do real work. Custom apps start at $1,000, full system builds start at $15,000.',
        },
      },
      {
        '@type': 'Question',
        name: 'What makes this different from just using ChatGPT?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ChatGPT is a general tool. What Zev builds are systems designed for your specific situation — they connect to your data, run on their own schedule, and do actual work without you having to prompt them every time.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does this cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Custom apps start at $1,000. The Insight Report is $499 and gives you a full picture of what to build — that $499 gets credited if you move forward. Full AI system builds start at $15,000. Ongoing support starts at $2,500/month.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need to be technical?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Not at all. Zev handles the entire technical side — design, build, deployment, and maintenance. You provide context about your situation and feedback on what is working. No coding, no jargon, no IT team required.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does it take?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A simple custom app can be done in 1-2 weeks. A full AI system build typically takes 4-8 weeks depending on scope. You will see the first working version within the first week of a build engagement.',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}

export function ServicesSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': 'https://askzev.ai/services#service',
    name: 'AI Implementation Consulting',
    provider: { '@id': 'https://askzev.ai/#organization' },
    url: 'https://askzev.ai/services',
    description: 'Custom AI systems designed, built, and deployed for businesses and individuals. From a free discovery conversation through full implementation and ongoing partnership.',
    areaServed: { '@type': 'Country', name: 'United States' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'AI Consulting Tiers',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Free AI Analysis',
            description: 'Fill out the discovery form and receive a personalized email with a genuine insight about your situation. No cost, no commitment.',
          },
        },
        {
          '@type': 'Offer',
          price: '499',
          priceCurrency: 'USD',
          itemOffered: {
            '@type': 'Service',
            name: 'AI Implementation Roadmap',
            description: 'A detailed, personalized roadmap with current state analysis, future vision, and 4 implementation phases — each with DIY, Guided, and Professional options. Delivered within 24 hours. Credits toward consultation.',
          },
        },
        {
          '@type': 'Offer',
          price: '2500',
          priceCurrency: 'USD',
          itemOffered: {
            '@type': 'Service',
            name: 'Private Consultation',
            description: 'One-on-one strategy session with Zev, fully prepared on your situation. Includes implementation priorities, architecture recommendations, and a clear path forward.',
          },
        },
        {
          '@type': 'Offer',
          price: '15000',
          priceCurrency: 'USD',
          itemOffered: {
            '@type': 'Service',
            name: 'AI System Build',
            description: 'Custom AI system designed, built, deployed, and integrated into your operations. 4-8 weeks, 30 days post-launch support. Starting from $15,000.',
          },
        },
        {
          '@type': 'Offer',
          price: '2500',
          priceCurrency: 'USD',
          itemOffered: {
            '@type': 'Service',
            name: 'Ongoing Partnership',
            description: 'Continuous system improvements, new capabilities, and performance monitoring. Month-to-month, no lock-in. Starting from $2,500/month.',
          },
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ServicesFaqSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How much does AI consulting cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Zev.AI offers a tiered model: a free AI analysis based on your discovery form, a $499 personalized roadmap (credits toward future work), a $2,500 private consultation, custom builds starting at $15,000, and ongoing partnerships from $2,500/month.',
        },
      },
      {
        '@type': 'Question',
        name: 'What does the $499 AI Roadmap include?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The roadmap includes a current state analysis of your pain points and industry context, a future vision with concrete outcomes and metrics, and 4 implementation phases — each with DIY, Guided, and Done-For-You options including specific tools, timelines, and cost estimates. Delivered within 24 hours as an interactive web page.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need technical knowledge to work with Zev.AI?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Zev handles the entire technical side — architecture, development, deployment, and maintenance. You provide context about your situation and feedback on what is working. No coding, no jargon, no IT team required.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does it take to build a custom AI system?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A focused tool or custom app typically takes 1-4 weeks. A full AI system build with multiple agents and integrations takes 4-8 weeks. You see the first working version within the first week of any engagement.',
        },
      },
      {
        '@type': 'Question',
        name: 'What industries does Zev.AI work with?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Zev.AI works across industries — real estate, manufacturing, education, professional services, e-commerce, and more. The common thread is businesses with repetitive processes, high communication volume, or complex data that can be automated or enhanced with AI.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the difference between Zev.AI and using ChatGPT?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ChatGPT is a general-purpose tool you prompt manually. Zev.AI builds custom systems designed for your specific situation — they connect to your data, run on their own schedule, coordinate multiple AI agents, and do actual work without you having to prompt them every time.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does the $499 roadmap credit toward future work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. The $499 roadmap investment credits toward any future consulting engagement, including the $2,500 private consultation (bringing it to $2,001) or a custom build project.',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function AboutSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': 'https://askzev.ai/about',
    name: 'About Zev Steinmetz',
    url: 'https://askzev.ai/about',
    mainEntity: { '@id': 'https://askzev.ai/#person' },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ApproachSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://askzev.ai/approach',
    name: 'Our Approach — Nature-Inspired Agent Architecture',
    url: 'https://askzev.ai/approach',
    description: 'Multi-agent AI systems built on geometric coordination patterns found in nature. 11 specialized agents, 22 communication pathways, and a 3-tier human oversight model.',
    isPartOf: { '@id': 'https://askzev.ai/#website' },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WorkSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': 'https://askzev.ai/work',
    name: 'Case Studies & Results',
    url: 'https://askzev.ai/work',
    description: 'Real AI systems deployed across real estate, education, and consulting — with measurable results.',
    isPartOf: { '@id': 'https://askzev.ai/#website' },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BlogIndexSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': 'https://askzev.ai/blog',
    name: 'zev.ai Blog — AI Implementation Insights',
    url: 'https://askzev.ai/blog',
    description: 'Practical insights on building and deploying AI systems for real business outcomes.',
    publisher: { '@id': 'https://askzev.ai/#organization' },
    isPartOf: { '@id': 'https://askzev.ai/#website' },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ContactSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': 'https://askzev.ai/contact',
    name: 'Contact Zev.AI',
    url: 'https://askzev.ai/contact',
    mainEntity: { '@id': 'https://askzev.ai/#business' },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
