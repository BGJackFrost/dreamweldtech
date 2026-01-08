import { Helmet } from 'react-helmet-async';

// Organization Schema
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DreamWeldTech",
    "alternateName": "Dream Weld Technology",
    "url": "https://dreamweldtech.vn",
    "logo": "https://dreamweldtech.vn/images/logo.png",
    "description": "Chuyên cung cấp máy hàn laser, máy cắt laser, máy làm sạch laser công nghiệp. Giải pháp hàn laser chính xác cao, tiết kiệm thời gian và chi phí sản xuất.",
    "foundingDate": "2020",
    "founders": [{
      "@type": "Person",
      "name": "DreamWeldTech Team"
    }],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Đường Công Nghiệp",
      "addressLocality": "Quận 7",
      "addressRegion": "TP. Hồ Chí Minh",
      "postalCode": "700000",
      "addressCountry": "VN"
    },
    "contactPoint": [{
      "@type": "ContactPoint",
      "telephone": "+84-123-456-789",
      "contactType": "customer service",
      "availableLanguage": ["Vietnamese", "English"]
    }, {
      "@type": "ContactPoint",
      "telephone": "+84-123-456-789",
      "contactType": "sales",
      "availableLanguage": ["Vietnamese", "English"]
    }],
    "sameAs": [
      "https://www.facebook.com/dreamweldtech",
      "https://www.youtube.com/@dreamweldtech",
      "https://www.linkedin.com/company/dreamweldtech"
    ],
    "areaServed": {
      "@type": "Country",
      "name": "Vietnam"
    },
    "knowsAbout": [
      "Laser Welding",
      "Laser Cutting",
      "Laser Cleaning",
      "Industrial Laser Technology"
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

// LocalBusiness Schema
export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://dreamweldtech.vn/#localbusiness",
    "name": "DreamWeldTech",
    "image": "https://dreamweldtech.vn/images/og-image.jpg",
    "url": "https://dreamweldtech.vn",
    "telephone": "+84-123-456-789",
    "email": "contact@dreamweldtech.com",
    "priceRange": "$$$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Đường Công Nghiệp",
      "addressLocality": "Quận 7",
      "addressRegion": "TP. Hồ Chí Minh",
      "postalCode": "700000",
      "addressCountry": "VN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "10.7326",
      "longitude": "106.7196"
    },
    "openingHoursSpecification": [{
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00",
      "closes": "17:30"
    }, {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "08:00",
      "closes": "12:00"
    }],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "156"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

// Product Schema
interface ProductSchemaProps {
  name: string;
  description: string;
  image: string;
  sku?: string;
  brand?: string;
  price?: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  url: string;
  category?: string;
}

export function ProductSchema({
  name,
  description,
  image,
  sku,
  brand = "DreamWeldTech",
  price,
  currency = "VND",
  availability = "InStock",
  url,
  category
}: ProductSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": description,
    "image": image.startsWith('http') ? image : `https://dreamweldtech.vn${image}`,
    "url": url.startsWith('http') ? url : `https://dreamweldtech.vn${url}`,
    "brand": {
      "@type": "Brand",
      "name": brand
    },
    "manufacturer": {
      "@type": "Organization",
      "name": "DreamWeldTech"
    }
  };

  if (sku) {
    schema.sku = sku;
    schema.mpn = sku;
  }

  if (category) {
    schema.category = category;
  }

  if (price) {
    schema.offers = {
      "@type": "Offer",
      "url": url.startsWith('http') ? url : `https://dreamweldtech.vn${url}`,
      "priceCurrency": currency,
      "price": price,
      "availability": `https://schema.org/${availability}`,
      "seller": {
        "@type": "Organization",
        "name": "DreamWeldTech"
      }
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

// Product List Schema (for category pages)
interface ProductListSchemaProps {
  products: Array<{
    name: string;
    description: string;
    image: string;
    url: string;
    price?: number;
  }>;
  listName: string;
}

export function ProductListSchema({ products, listName }: ProductListSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": listName,
    "numberOfItems": products.length,
    "itemListElement": products.map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        "image": product.image.startsWith('http') ? product.image : `https://dreamweldtech.vn${product.image}`,
        "url": product.url.startsWith('http') ? product.url : `https://dreamweldtech.vn${product.url}`,
        ...(product.price && {
          "offers": {
            "@type": "Offer",
            "priceCurrency": "VND",
            "price": product.price
          }
        })
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

// Article Schema (for news/blog)
interface ArticleSchemaProps {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  url: string;
}

export function ArticleSchema({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author = "DreamWeldTech",
  url
}: ArticleSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": headline,
    "description": description,
    "image": image.startsWith('http') ? image : `https://dreamweldtech.vn${image}`,
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "author": {
      "@type": "Organization",
      "name": author
    },
    "publisher": {
      "@type": "Organization",
      "name": "DreamWeldTech",
      "logo": {
        "@type": "ImageObject",
        "url": "https://dreamweldtech.vn/images/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url.startsWith('http') ? url : `https://dreamweldtech.vn${url}`
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

// FAQ Schema
interface FAQSchemaProps {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQSchema({ questions }: FAQSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(q => ({
      "@type": "Question",
      "name": q.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

// BreadcrumbList Schema
interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith('http') ? item.url : `https://dreamweldtech.vn${item.url}`
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

// WebSite Schema with SearchAction
export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "DreamWeldTech",
    "alternateName": "Dream Weld Technology",
    "url": "https://dreamweldtech.vn",
    "description": "Giải pháp công nghệ laser hàng đầu Việt Nam - Máy hàn laser, máy cắt laser, máy làm sạch laser công nghiệp",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://dreamweldtech.vn/products?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": ["vi", "en", "ja", "zh"]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

// Combined Schema for Homepage
export function HomePageSchema() {
  return (
    <>
      <OrganizationSchema />
      <LocalBusinessSchema />
      <WebSiteSchema />
    </>
  );
}
