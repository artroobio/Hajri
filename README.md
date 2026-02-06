# HAJRI - Construction Site Attendance & Payroll Management

A modern, full-stack construction site management application built with React, TypeScript, Vite, and Supabase.

## Features

- 👷 **Worker Management** - Add, track, and manage construction workers
- 📅 **Daily Attendance** - Easy attendance tracking with Hajri count system
- 💰 **Payroll Tracking** - Automated wage calculations and payment history
- 📊 **Estimates & BOQ** - AI-powered estimate creation from documents
- 💳 **Client Ledger** - Track payments and invoices
- 📈 **Reports & Analytics** - Comprehensive financial and labor reports
- 🏗️ **Multi-Project Support** - Manage multiple construction sites
- 🤖 **AI Integration** - OpenAI-powered document parsing

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **AI:** OpenAI API (via Cloudflare Worker proxy)
- **PDF Generation:** jsPDF
- **Charts:** Recharts

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- OpenAI API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Hajri
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   
   Run the migration files in your Supabase SQL editor:
   ```bash
   # Run these files in order:
   supabase/migrations/*.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Database Setup

The application requires several tables and RLS policies. Key tables include:

- `workers` - Worker information
- `attendance` - Daily attendance records
- `estimates` & `estimate_items` - Project estimates
- `expenses` - Material and other expenses
- `client_ledger` - Payment tracking
- `projects` - Multi-project support

### Running Migrations

Use Supabase CLI or run the SQL files in the `supabase/migrations` folder through the Supabase dashboard.

## Available Scripts

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint (when configured)

## Project Structure

```
Hajri/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── context/        # React Context providers
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   └── layouts/        # Layout components
├── supabase/           # Database migrations and config
├── public/             # Static assets
└── functions/          # Cloudflare Worker (OpenAI proxy)
```

## AI Features

The application uses OpenAI's GPT models for:
- Parsing estimates from uploaded documents (images, PDFs, Excel)
- Extracting expense data from text/images
- Converting natural language into structured data

**Note:** AI features require an OpenAI API key configured via Cloudflare Worker.

## Security

- Row-Level Security (RLS) enabled on all tables
- Environment variables for sensitive credentials
- Authentication required for all routes
- API key proxying through Cloudflare Worker

## Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Deploy to Vercel/Netlify/Cloudflare Pages

1. Connect your repository
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add a `_redirects` file for SPA routing:
   ```
   /* /index.html 200
   ```

## Contributing

Contributions are welcome! Please ensure:
- Code follows existing patterns
- TypeScript types are properly defined
- Components are properly documented

## License

[Your License Here]

## Support

For support or questions, contact [Your Contact Info]

---

**Built with ❤️ for the construction industry**
