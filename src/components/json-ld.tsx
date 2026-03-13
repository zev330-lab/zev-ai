export function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://zev.ai/#organization',
        name: 'zev.ai',
        url: 'https://zev.ai',
        description: 'AI implementation consulting — real systems, deployed and working.',
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
        description: 'Custom AI systems built and deployed for businesses. From workflow automation to intelligent agents.',
        areaServed: 'US',
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
