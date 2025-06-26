import React from 'react';

interface ModernWebTemplateProps {
  siteName: string;
  siteDescription: string;
  hero: {
    title: string;
    subtitle: string;
    description: string;
    cta: {
      primary: { text: string; href: string };
      secondary: { text: string; href: string };
    };
  };
  features: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  techStack: Array<{
    name: string;
    icon: string;
    description: string;
  }>;
  demo?: {
    title: string;
    description: string;
    demoUrl: string;
    screenshots: string[];
  };
  partners: Array<{
    name: string;
    ctaText: string;
    description: string;
    logo: string;
    url: string;
  }>;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
}

export function ModernWebTemplate(props: ModernWebTemplateProps) {
  const { siteName, hero, features, techStack, demo, partners, theme } = props;

  return (
    <div className="modern-web-template">
      <style>{`
        .modern-web-template {
          font-family: ${theme.fontFamily};
          line-height: 1.6;
          color: #1a202c;
        }
        .hero {
          background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor});
          color: white;
          padding: 100px 0;
          text-align: center;
        }
        .hero h1 {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        .hero p {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-primary {
          background: ${theme.accentColor};
          color: white;
        }
        .btn-secondary {
          background: rgba(255,255,255,0.2);
          color: white;
          border: 2px solid rgba(255,255,255,0.3);
        }
        .section {
          padding: 80px 0;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }
        .feature-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-5px);
        }
        .tech-stack {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }
        .tech-item {
          background: #f7fafc;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          text-align: center;
          min-width: 120px;
        }
        .partners-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }
        .partner-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          text-align: center;
        }
        .footer {
          background: #2d3748;
          color: white;
          padding: 40px 0;
          text-align: center;
        }
      `}</style>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>{hero.title}</h1>
          <p>{hero.subtitle}</p>
          <div className="cta-buttons">
            <a href={hero.cta.primary.href} className="btn btn-primary">
              {hero.cta.primary.text}
            </a>
            <a href={hero.cta.secondary.href} className="btn btn-secondary">
              {hero.cta.secondary.text}
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>
            Key Features
          </h2>
          <p style={{ textAlign: 'center', fontSize: '1.125rem', color: '#64748b', marginBottom: '3rem' }}>
            Discover what makes {siteName} exceptional
          </p>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                  {getIconEmoji(feature.icon)}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#64748b' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      {techStack.length > 0 && (
        <section className="section" style={{ background: '#f8fafc' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>
              Technology Stack
            </h2>
            <div className="tech-stack">
              {techStack.map((tech, index) => (
                <div key={index} className="tech-item">
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    {getIconEmoji(tech.icon)}
                  </div>
                  <div style={{ fontWeight: '600' }}>{tech.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Demo Section */}
      {demo && (
        <section className="section">
          <div className="container">
            <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>
              {demo.title}
            </h2>
            <p style={{ textAlign: 'center', fontSize: '1.125rem', color: '#64748b', marginBottom: '3rem' }}>
              {demo.description}
            </p>
            <div style={{ textAlign: 'center' }}>
              <a href={demo.demoUrl} className="btn btn-primary" style={{ display: 'inline-block' }}>
                Try Live Demo
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Partners Section */}
      {partners.length > 0 && (
        <section className="section" style={{ background: '#f8fafc' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>
              Recommended Tools
            </h2>
            <p style={{ textAlign: 'center', fontSize: '1.125rem', color: '#64748b', marginBottom: '3rem' }}>
              Enhance your project with these powerful integrations
            </p>
            <div className="partners-grid">
              {partners.map((partner, index) => (
                <div key={index} className="partner-card">
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {partner.name}
                  </h3>
                  <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {partner.description}
                  </p>
                  <a href={partner.url} className="btn btn-primary" style={{ display: 'inline-block', fontSize: '0.875rem' }}>
                    {partner.ctaText}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>Generated with ❤️ by Project4Site</p>
          <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>
            <a href="https://project4site.com" style={{ color: 'inherit' }}>Create your own site</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function getIconEmoji(icon: string): string {
  const iconMap: Record<string, string> = {
    star: '⭐',
    zap: '⚡',
    shield: '🛡️',
    database: '🗄️',
    api: '🔌',
    lock: '🔒',
    code: '💻',
    javascript: '🟨',
    typescript: '🔷',
    react: '⚛️',
    nodejs: '🟢',
    python: '🐍',
    rust: '🦀',
    go: '🐹',
    docker: '🐳',
  };
  return iconMap[icon] || '✨';
}