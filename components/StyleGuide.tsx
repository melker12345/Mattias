

export function StyleGuide() {
  return (
    <div className="mn-container py-12">
      <h1 className="text-4xl font-bold text-mn-dark-blue-green mb-8 font-montserrat">
        MN Group Style Guide
      </h1>
      
      {/* Color Palette */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-mn-dark-blue-green mb-6 font-montserrat">
          Färgpalett
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-mn-white border border-mn-light-gray-blue rounded-lg mb-2 mx-auto"></div>
            <p className="text-sm font-open-sans">Vit bakgrund</p>
            <p className="text-xs text-mn-dark-blue-green/70 font-open-sans">#FFFFFF</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-mn-nearly-white border border-mn-light-gray-blue rounded-lg mb-2 mx-auto"></div>
            <p className="text-sm font-open-sans">Nästan vit</p>
            <p className="text-xs text-mn-dark-blue-green/70 font-open-sans">#FEFEFE</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-mn-light-gray-blue rounded-lg mb-2 mx-auto"></div>
            <p className="text-sm font-open-sans">Ljusgrå/blå</p>
            <p className="text-xs text-mn-dark-blue-green/70 font-open-sans">#CDD7DB</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-mn-very-light-gray border border-mn-light-gray-blue rounded-lg mb-2 mx-auto"></div>
            <p className="text-sm font-open-sans">Mycket ljus grå</p>
            <p className="text-xs text-mn-dark-blue-green/70 font-open-sans">#F9FAFA</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-mn-dark-blue-green rounded-lg mb-2 mx-auto"></div>
            <p className="text-sm font-open-sans text-mn-white">Mörkblå/grön</p>
            <p className="text-xs text-mn-white/70 font-open-sans">#355E71</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-mn-extra-light border border-mn-light-gray-blue rounded-lg mb-2 mx-auto"></div>
            <p className="text-sm font-open-sans">Extra ljus ton</p>
            <p className="text-xs text-mn-dark-blue-green/70 font-open-sans">#FBFCFC</p>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-mn-dark-blue-green mb-6 font-montserrat">
          Typsnitt
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-mn-dark-blue-green mb-2 font-montserrat">
              Montserrat Bold - Rubriker
            </h3>
            <p className="text-4xl font-bold text-mn-dark-blue-green font-montserrat">
              H1 Rubrik - Montserrat Bold
            </p>
            <p className="text-2xl font-bold text-mn-dark-blue-green font-montserrat">
              H2 Rubrik - Montserrat Bold
            </p>
            <p className="text-xl font-bold text-mn-dark-blue-green font-montserrat">
              H3 Rubrik - Montserrat Bold
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-mn-dark-blue-green mb-2 font-montserrat">
              Open Sans Regular - Brödtext
            </h3>
            <p className="text-lg text-mn-dark-blue-green font-open-sans">
              Detta är brödtext i Open Sans Regular. Den används för all vanlig text och innehåll.
            </p>
            <p className="text-base text-mn-dark-blue-green/80 font-open-sans">
              Mindre brödtext med lägre opacitet för sekundär information.
            </p>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-mn-dark-blue-green mb-6 font-montserrat">
          Knappar
        </h2>
        <div className="flex flex-wrap gap-4">
          <button className="btn-primary">
            Primär knapp
          </button>
          <button className="btn-secondary">
            Sekundär knapp
          </button>
          <button className="bg-mn-light-gray-blue text-mn-dark-blue-green px-4 py-2 rounded-lg hover:bg-mn-light-gray-blue/80 transition-colors font-open-sans">
            Tertiär knapp
          </button>
        </div>
      </section>

      {/* Cards */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-mn-dark-blue-green mb-6 font-montserrat">
          Kort
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-mn-dark-blue-green mb-2 font-montserrat">
              Exempel kort
            </h3>
            <p className="text-mn-dark-blue-green/80 font-open-sans">
              Detta är ett exempel på hur kort ser ut med den nya MN Group-stylingen.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-mn-dark-blue-green mb-2 font-montserrat">
              Ett till kort
            </h3>
            <p className="text-mn-dark-blue-green/80 font-open-sans">
              Kort använder vita bakgrunder med ljusgrå/blå borders för en ren och professionell look.
            </p>
          </div>
        </div>
      </section>

      {/* Logo */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-mn-dark-blue-green mb-6 font-montserrat">
          Logotyp
        </h2>
        <div className="text-center">
          <img 
            src="/logos/MN_Utbildning.png" 
            alt="MN Utbildning Logo" 
            className="max-w-md mx-auto"
          />
          <p className="text-sm text-mn-dark-blue-green/70 mt-4 font-open-sans">MN Utbildning</p>
        </div>
      </section>

      {/* Form Elements */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-mn-dark-blue-green mb-6 font-montserrat">
          Formulärelement
        </h2>
        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-mn-dark-blue-green mb-2 font-open-sans">
              Textfält
            </label>
            <input 
              type="text" 
              placeholder="Skriv här..." 
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-mn-dark-blue-green mb-2 font-open-sans">
              Textarea
            </label>
            <textarea 
              placeholder="Skriv här..." 
              className="input-field"
              rows={3}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
