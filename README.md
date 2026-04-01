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
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Payment**: Fortnox invoice integration
- **Deployment Ready**: Optimized for production deployment

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **Database**: PostgreSQL, Supabase
- **Authentication**: Supabase Auth
- **Payment**: Fortnox
- **Forms**: React Hook Form, Zod validation
- **Animations**: Framer Motion
- **Icons**: Heroicons

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ 
- npm or yarn
- Supabase project (database + auth)
- Fortnox account (for invoicing)

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
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Fortnox
FORTNOX_CLIENT_SECRET="..."
FORTNOX_ACCESS_TOKEN="..."

# App
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@example.com"
```

### 4. Set up the database
Run the SQL migrations in your Supabase project Dashboard → SQL Editor.
The migration files are located in `supabase/migrations/`.

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
├── supabase/              # Database migrations and SQL schema
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
- Fortnox invoice creation for course and company purchases
- Course enrollment management
- 30-day payment terms

### User Dashboard
- Course progress overview
- Certificate management
- Profile settings

## 🔧 Configuration

### Database Configuration
The platform uses Supabase (PostgreSQL). Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in your environment variables.

### Fortnox Configuration
1. Create a Fortnox account and enable API access
2. Generate a Client Secret and Access Token
3. Add `FORTNOX_CLIENT_SECRET` and `FORTNOX_ACCESS_TOKEN` to your environment variables

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
- SQL injection prevention via parameterised Supabase queries
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
