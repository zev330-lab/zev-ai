export function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://zev.ai/#organization',
        name: 'zev.ai',
        url: 'https://zev.ai',
        description: 'AI implementation consulting — production AI systems built for businesses.',
        founder: {
          '@type': 'Person',
          name: 'Zev Steinmetz',
          jobTitle: 'AI Implementation Consultant',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Newton',
            addressRegion: 'MA',
            addressCountry: 'US',
          },
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://zev.ai/#website',
        url: 'https://zev.ai',
        name: 'zev.ai',
        publisher: { '@id': 'https://zev.ai/#organization' },
      },
      {
        '@type': 'ProfessionalService',
        name: 'AI Implementation Consulting',
        provider: { '@id': 'https://zev.ai/#organization' },
        description: 'Custom AI systems built and deployed for businesses. From intelligent agents to workflow automation.',
        areaServed: 'US',
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'AI Services',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'AI Readiness Assessment',
                description: 'Structured deep-dive into your business to identify where AI creates real value.',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'AI Implementation',
                description: 'Design, build, and deploy AI systems integrated into your operations.',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Fractional AI Officer',
                description: 'Ongoing AI leadership embedded in your team.',
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
