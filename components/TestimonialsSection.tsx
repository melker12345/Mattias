import Image from 'next/image'

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Anders Johansson",
      role: "Byggarbetare",
      content: "Utmärkt kurs! Tydlig information och enkelt att förstå. Kunde studera i min egen takt och fick mitt certifikat direkt.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Maria Lindberg",
      role: "Projektledare",
      content: "Perfekt för vårt team. Vi kunde alla gå kursen samtidigt och få certifikaten vi behövde för projektet.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Erik Svensson",
      role: "Säkerhetsansvarig",
      content: "Hög kvalitet på kursmaterialet och bra support när jag hade frågor. Rekommenderas varmt!",
      rating: 5,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    }
  ]

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-mn-light-gray-blue'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))
  }

  return (
    <section className="py-16 bg-mn-very-light-gray">
      <div className="mn-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-mn-dark-blue-green mb-4 font-montserrat">
            Vad Våra Kunder Säger
          </h2>
          <p className="text-lg text-mn-dark-blue-green/80 max-w-3xl mx-auto font-open-sans">
            Läs vad andra har att säga om sina erfarenheter med våra kurser
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="card">
              <div className="flex items-center mb-4">
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-semibold text-mn-dark-blue-green font-montserrat">{testimonial.name}</h4>
                  <p className="text-sm text-mn-dark-blue-green/70 font-open-sans">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex mb-4">
                {renderStars(testimonial.rating)}
              </div>
              
              <p className="text-mn-dark-blue-green/80 italic font-open-sans">
                &quot;{testimonial.content}&quot;
              </p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <div className="inline-flex items-center bg-mn-white rounded-full px-6 py-3 shadow-md border border-mn-light-gray-blue">
            <div className="flex items-center mr-4">
              {renderStars(5)}
            </div>
            <span className="text-lg font-semibold text-mn-dark-blue-green font-montserrat">
              4.9/5 från över 1000+ recensioner
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
