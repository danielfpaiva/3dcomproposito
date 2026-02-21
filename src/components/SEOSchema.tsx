import { Helmet } from "react-helmet";

/**
 * SEO Schema.org structured data component
 * Helps search engines understand the content and improves rich snippets
 */
const SEOSchema = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "NGO",
    "name": "3D com Propósito",
    "alternateName": "3D com Proposito",
    "url": "https://www.3dcomproposito.pt",
    "logo": "https://www.3dcomproposito.pt/3D_com_Propósito-sem-fundo.png",
    "description": "Organização solidária que fornece cadeiras de rodas infantis gratuitas para crianças dos 18 meses aos 8 anos em Portugal através de impressão 3D distribuída",
    "areaServed": {
      "@type": "Country",
      "name": "Portugal"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "areaServed": "PT",
      "availableLanguage": ["Portuguese"]
    }
  };

  const medicalDeviceSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalDevice",
    "name": "Cadeira de Rodas Infantil TMT (Toddler Mobility Trainer)",
    "description": "Cadeira de rodas para crianças dos 18 meses aos 8 anos, fabricada através de impressão 3D. Dispositivo de mobilidade gratuito para crianças com necessidades especiais em Portugal.",
    "manufacturer": {
      "@type": "Organization",
      "name": "3D com Propósito"
    },
    "audience": {
      "@type": "PeopleAudience",
      "suggestedMinAge": 1.5,
      "suggestedMaxAge": 8
    },
    "category": "Mobility Device"
  };

  const medicalServiceSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "name": "3D com Propósito - Cadeiras de Rodas Infantis",
    "description": "Fornecemos cadeiras de rodas gratuitas para crianças em Portugal. Mobilidade infantil através de impressão 3D solidária para crianças dos 18 meses aos 8 anos.",
    "url": "https://www.3dcomproposito.pt",
    "priceRange": "Gratuito",
    "areaServed": {
      "@type": "Country",
      "name": "Portugal"
    },
    "medicalSpecialty": ["Pediatric Rehabilitation", "Mobility Assistance"]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Início",
        "item": "https://www.3dcomproposito.pt"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Pedir Cadeira",
        "item": "https://www.3dcomproposito.pt/request"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Voluntariar-se",
        "item": "https://www.3dcomproposito.pt/contribute"
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(medicalDeviceSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(medicalServiceSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
};

export default SEOSchema;
