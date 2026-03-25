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
      },
      {
        '@type': ['ProfessionalService', 'LocalBusiness'],
        '@id': 'https://askzev.ai/#business',
        name: 'zev.ai — AI Implementation Consulting',
        provider: { '@id': 'https://askzev.ai/#organization' },
        description: 'Custom AI systems built and deployed for businesses and individuals. From free discovery through full implementation and ongoing support.',
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
