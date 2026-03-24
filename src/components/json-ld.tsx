export function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://askzev.ai/#organization',
        name: 'zev.ai',
        url: 'https://askzev.ai',
        description: 'AI implementation consulting — production multi-agent AI systems built for businesses.',
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
        description: 'Custom multi-agent AI systems built and deployed for businesses. From AI readiness assessments to full implementation and ongoing optimization.',
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
        image: 'https://askzev.ai/api/og/social?text=AI%20systems%20that%20drive%20revenue&pillar=zev.ai&format=landscape&style=blog',
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
                name: 'AI Readiness Assessment',
                description: 'Structured deep-dive into your business to identify where AI creates real value. Includes competitive analysis, workflow mapping, and prioritized AI opportunity roadmap. Starting from $2,500.',
                url: 'https://askzev.ai/services',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'AI Implementation & Build',
                description: 'Design, build, and deploy production multi-agent AI systems integrated into your operations. Automated workflows, real-time dashboards, and 24/7 agent monitoring. Starting from $5,000.',
                url: 'https://askzev.ai/services',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Ongoing AI Optimization',
                description: 'Fractional AI leadership embedded in your team. Performance monitoring, iteration, capability expansion, and continuous improvement. Starting from $5,000/month.',
                url: 'https://askzev.ai/services',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'AI Scale & Enterprise Deployment',
                description: 'Multi-system deployment across your organization. Shared intelligence between departments, unified oversight, and cross-product automation. Custom pricing.',
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
        name: 'How much does AI consulting cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AI consulting engagements start at $2,500 for a 2-3 week readiness assessment. Build projects typically range from $5,000-$25,000 depending on scope. Ongoing optimization starts at $5,000/month.',
        },
      },
      {
        '@type': 'Question',
        name: 'What does an AI consultant actually do?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We build and deploy production AI systems — not strategy decks. That means identifying high-leverage automation opportunities, designing multi-agent architectures, building the software, integrating it into your operations, and ensuring it delivers measurable ROI.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does AI implementation take?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'An AI readiness assessment takes 2-3 weeks. Building and deploying a production AI system typically takes 4-12 weeks depending on complexity. Most clients see first measurable results within 6 weeks.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need a technical team to work with you?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. We handle the entire technical build — architecture, development, deployment, and monitoring. Your team provides business context and feedback. We deploy on managed infrastructure so there is nothing for your IT team to maintain.',
        },
      },
      {
        '@type': 'Question',
        name: 'What industries do you work with?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We have built AI systems for D2C brands, manufacturing, media companies, real estate, and professional services. The multi-agent architecture adapts to any domain — the coordination patterns are universal while agents are specialized for your industry.',
        },
      },
      {
        '@type': 'Question',
        name: 'How is this different from hiring a big consulting firm?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Big firms hand you a roadmap and bill $250K+ for it. Then you need to hire someone else to build the system. We design it, build it, deploy it, and prove it works — all in one engagement. You work directly with the person building your system, not a junior associate.',
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
