export function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://zev.ai/#organization',
        name: 'zev.ai',
        url: 'https://zev.ai',
        description: 'AI implementation consulting — custom AI systems, automated workflows, and intelligent platforms for businesses.',
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
        '@type': 'Service',
        name: 'AI Readiness Assessment',
        provider: { '@id': 'https://zev.ai/#organization' },
        description: 'Comprehensive audit of business operations to identify highest-ROI AI opportunities.',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: '2500',
          priceSpecification: {
            '@type': 'PriceSpecification',
            minPrice: '2500',
            maxPrice: '5000',
            priceCurrency: 'USD',
          },
        },
      },
      {
        '@type': 'Service',
        name: 'AI Workflow Implementation',
        provider: { '@id': 'https://zev.ai/#organization' },
        description: 'Custom-built AI systems deployed directly into your business operations.',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: '5000',
          priceSpecification: {
            '@type': 'PriceSpecification',
            minPrice: '5000',
            maxPrice: '25000',
            priceCurrency: 'USD',
          },
        },
      },
      {
        '@type': 'Service',
        name: 'Fractional AI Officer',
        provider: { '@id': 'https://zev.ai/#organization' },
        description: 'Ongoing AI strategy and implementation embedded in your business.',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: '5000',
          priceSpecification: {
            '@type': 'PriceSpecification',
            minPrice: '5000',
            maxPrice: '10000',
            priceCurrency: 'USD',
            unitText: 'MONTH',
          },
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
