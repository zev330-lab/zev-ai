export function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://askzev.ai/#organization',
        name: 'zev.ai',
        url: 'https://askzev.ai',
        description: 'AI implementation consulting — production AI systems built for businesses.',
        founder: { '@id': 'https://askzev.ai/#person' },
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
        description: 'Custom multi-agent AI systems built and deployed for businesses. From intelligent agents to workflow automation.',
        url: 'https://askzev.ai',
        email: 'hello@askzev.ai',
        telephone: '',
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
        sameAs: [],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'AI Services',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'AI Readiness Assessment',
                description: 'Structured deep-dive into your business to identify where AI creates real value. Starting from $2,500.',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'AI Implementation',
                description: 'Design, build, and deploy production AI systems integrated into your operations. Starting from $5,000.',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Ongoing AI Optimization',
                description: 'Fractional AI leadership embedded in your team. Starting from $5,000/month.',
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
