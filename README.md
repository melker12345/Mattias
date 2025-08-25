# Utbildningsplattform - Swedish Online Course Platform

A modern, full-featured online course platform built with Next.js, TypeScript, and Tailwind CSS. This platform is designed for selling professional courses in Swedish, similar to platforms like APV Utbildarna and Kravkompetens.

## 🚀 Features

### Core Features
- **User Authentication**: Secure login/registration with NextAuth.js
- **Course Management**: Complete course catalog with filtering and search
- **Interactive Learning**: Video lessons, quizzes, and progress tracking
- **Payment Integration**: Stripe payment processing for course purchases
- **Responsive Design**: Mobile-first design that works on all devices
- **Admin Panel**: Course management and user administration
- **Certificates**: Digital certificates upon course completion

### Course Features
- **Multiple Question Types**: Multiple choice, true/false, and text questions
- **Media Support**: Videos, images, and rich content in lessons
- **Progress Tracking**: Real-time progress monitoring
- **Quiz System**: Interactive assessments with immediate feedback
- **Certificate Generation**: Professional certificates for completed courses

### Technical Features
- **Modern Stack**: Next.js 14, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **Payment**: Stripe integration
- **Deployment Ready**: Optimized for production deployment

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **Database**: PostgreSQL, Prisma ORM
- **Authentication**: NextAuth.js
- **Payment**: Stripe
- **Forms**: React Hook Form, Zod validation
- **Animations**: Framer Motion
- **Icons**: Heroicons

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- Stripe account (for payments)

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd utbildningsplattform
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Set up environment variables
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/utbildningsplattform"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. Set up the database
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed the database with sample data
npx prisma db seed
```

### 5. Start the development server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── courses/           # Course pages
│   ├── dashboard/         # User dashboard
│   └── globals.css        # Global styles
├── components/            # Reusable components
├── lib/                   # Utility functions and configurations
├── prisma/                # Database schema and migrations
├── public/                # Static assets
└── types/                 # TypeScript type definitions
```

## 🎯 Key Components

### Authentication System
- User registration and login
- Password hashing with bcrypt
- JWT-based sessions
- Role-based access control

### Course Management
- Course creation and editing
- Lesson management with rich content
- Question and quiz system
- Progress tracking

### Payment System
- Stripe integration for secure payments
- Course enrollment management
- Invoice generation

### User Dashboard
- Course progress overview
- Certificate management
- Profile settings

## 🔧 Configuration

### Database Configuration
The platform uses PostgreSQL with Prisma ORM. Update the `DATABASE_URL` in your environment variables to point to your database.

### Stripe Configuration
1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Add them to your environment variables
4. Set up webhook endpoints for payment processing

### Email Configuration
Configure your email provider for sending notifications and certificates.

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📊 Database Schema

The platform includes the following main entities:
- **Users**: User accounts and authentication
- **Courses**: Course information and metadata
- **Lessons**: Individual course lessons
- **Questions**: Quiz questions and answers
- **Enrollments**: User course enrollments
- **Progress**: User progress tracking
- **Certificates**: Course completion certificates

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- CSRF protection
- Input validation with Zod
- SQL injection prevention with Prisma
- XSS protection

## 📱 Responsive Design

The platform is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes and orientations

## 🎨 Customization

### Styling
The platform uses Tailwind CSS for styling. You can customize:
- Color scheme in `tailwind.config.js`
- Component styles in `app/globals.css`
- Individual component styling

### Content
- Update course content through the admin panel
- Customize email templates
- Modify certificate designs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

## 🔄 Updates and Maintenance

- Regular security updates
- Feature additions
- Performance optimizations
- Bug fixes

---

Built with ❤️ for the Swedish education market
