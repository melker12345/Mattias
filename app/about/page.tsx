export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Om Oss
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Vi är Sveriges ledande plattform för professionella onlinekurser inom säkerhet, 
            arbete på väg och kompetensutveckling.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Vårt Uppdrag
            </h2>
            <div className="prose prose-lg mx-auto text-gray-600">
              <p className="mb-6">
                Sedan vår grundande har vi varit dedikerade till att göra kvalitativ utbildning 
                tillgänglig för alla. Vi tror på kraften i kontinuerlig lärande och strävar efter 
                att erbjuda kurser som inte bara uppfyller branschens krav utan också inspirerar 
                till personlig och professionell utveckling.
              </p>
              <p className="mb-6">
                Våra kurser är utformade av erfarna instruktörer och följer de senaste 
                reglerna och riktlinjerna inom respektive område. Vi arbetar nära branschledare 
                för att säkerställa att vårt innehåll är relevant, aktuellt och praktiskt 
                användbart.
              </p>
              <p>
                Genom vår plattform kan du studera i din egen takt, när det passar dig, 
                och få omedelbar feedback på dina framsteg. Vi är stolta över att ha hjälpt 
                tusentals professionella att utveckla sina färdigheter och uppnå sina mål.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Kvalitet</h3>
            <p className="text-gray-600">
              Vi levererar endast kurser av högsta kvalitet, utformade av experter inom sina områden.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
            <p className="text-gray-600">
              Vi använder modern teknologi för att skapa engagerande och effektiva lärupplevelser.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Samhällsansvar</h3>
            <p className="text-gray-600">
              Vi bidrar till ett säkrare samhälle genom att utbilda professionella inom säkerhet och kvalitet.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Vårt Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Anna Andersson</h3>
                <p className="text-primary-600 mb-2">VD & Grundare</p>
                <p className="text-sm text-gray-600">
                  Över 15 års erfarenhet inom utbildning och säkerhet. 
                  Passionerad för att göra kvalitativ utbildning tillgänglig för alla.
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Erik Eriksson</h3>
                <p className="text-primary-600 mb-2">Utbildningschef</p>
                <p className="text-sm text-gray-600">
                  Expert inom pedagogik och kursutveckling. 
                  Ansvarar för kvaliteten på alla våra kurser.
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Maria Nilsson</h3>
                <p className="text-primary-600 mb-2">Kundsupport</p>
                <p className="text-sm text-gray-600">
                  Dedikerad till att hjälpa våra kunder få ut mesta möjliga av sina kurser.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-primary-600 rounded-lg text-white p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">10,000+</div>
              <div className="text-primary-200">Nöjda kunder</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-primary-200">Kurser</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">95%</div>
              <div className="text-primary-200">Genomförande</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-primary-200">Support</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Redo att börja din resa?
          </h2>
          <p className="text-gray-600 mb-6">
            Utforska våra kurser och ta nästa steg i din karriärutveckling.
          </p>
          <a
            href="/courses"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Utforska Kurser
          </a>
        </div>
      </div>
    </div>
  )
}
