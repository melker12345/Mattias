export function FeaturesSection() {
  const features = [
    {
      title: "ID06-Certifierade Kurser",
      description: "Alla kurser är ID06-certifierade med BankID-verifiering för maximal säkerhet och compliance.",
      icon: (
        <svg className="w-8 h-8 text-mn-dark-blue-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Företagsadministration",
      description: "Enkel hantering av anställda, kursköp och progressöversikt för företagskonton.",
      icon: (
        <svg className="w-8 h-8 text-mn-dark-blue-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: "BankID-verifiering",
      description: "Säker identitetsverifiering med BankID för alla anställda som behöver ID06-certifikat.",
      icon: (
        <svg className="w-8 h-8 text-mn-dark-blue-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: "Digitala ID06-certifikat",
      description: "Automatisk generering av ID06-certifikat efter slutförd kurs med fullständig verifiering.",
      icon: (
        <svg className="w-8 h-8 text-mn-dark-blue-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: "Fakturabetalning",
      description: "Enkel fakturabetalning med 30 dagars betalningsvillkor för företagskonton.",
      icon: (
        <svg className="w-8 h-8 text-mn-dark-blue-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: "24/7 Support",
      description: "Dedikerad support för företagskonton med snabb hjälp när du behöver det.",
      icon: (
        <svg className="w-8 h-8 text-mn-dark-blue-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
        </svg>
      )
    }
  ]

  return (
    <section className="py-16 mn-section">
      <div className="mn-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-mn-dark-blue-green mb-4 font-montserrat">
            Varför Välja Vår Plattform?
          </h2>
          <p className="text-lg text-mn-dark-blue-green/80 max-w-3xl mx-auto font-open-sans">
            Sveriges mest avancerade företagsutbildningsplattform med ID06-integration, 
            BankID-verifiering och komplett företagsadministration.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-mn-dark-blue-green mb-2 font-montserrat">
                    {feature.title}
                  </h3>
                  <p className="text-mn-dark-blue-green/80 font-open-sans">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
