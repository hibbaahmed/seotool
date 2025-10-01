# SEOFlow - AI-Powered SEO Automation Platform

**Rank Clients on Google and Get Cited on ChatGPT – In One Place**

SEOFlow is a comprehensive SEO automation system for agencies and marketers, featuring AI-powered tools for content creation, optimization, and syndication.

## 🚀 Features

### AI SEO Writer
- Generate brand-tailored content in 150+ languages
- Publish content to CMS (WordPress, custom backend)
- Syndicate content automatically to social media
- Include structured formatting: images, videos, links, table of contents

### AI SEO Editor
- Edit new and existing content
- Rewrite content with custom prompts
- Add internal/external links
- Regenerate images with custom prompts
- Insert keywords naturally

### SEO Agent
- Automatically detect and fix SEO issues
- Meta titles, descriptions, canonical URLs, alt texts
- Add structured data (Schema markup)
- Improve internal linking structure

### Autoblog / Content Automation
- Generate blog content based on feeds (RSS, YouTube, news, keywords)
- Manual or automated scheduling of posts
- Auto-publish social media posts with copy and images
- Index pages on Google quickly and rank effectively using AI

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **AI**: OpenAI GPT-4
- **Authentication**: NextAuth.js
- **UI Components**: Headless UI, Heroicons
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (recommended)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/seotool.git
   cd seotool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Random secret for JWT tokens
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `NEXTAUTH_SECRET`: Random secret for NextAuth.js

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
```bash
npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄 Database Schema

The application uses Prisma with PostgreSQL. Key models include:

- **User**: User accounts and authentication
- **Project**: SEO projects and websites
- **Content**: Blog posts, pages, and product descriptions
- **SEOIssue**: Detected SEO problems and fixes
- **SocialMediaPost**: Social media content and scheduling
- **Analytics**: Performance metrics and tracking
- **RSSFeed**: RSS feed sources for content automation
- **AutomationRule**: Content automation rules

## 🔧 Configuration

### OpenAI Integration
1. Get your API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it to your `.env.local` file
3. The AI will generate content, optimize SEO, and provide suggestions

### Database Setup
1. Create a PostgreSQL database
2. Update the `DATABASE_URL` in your `.env.local`
3. Run `npx prisma db push` to create tables

### Social Media Integration (Optional)
Add API keys for social media platforms in your `.env.local`:
- Twitter API v2
- Facebook Graph API
- LinkedIn API

### CMS Integration (Optional)
Configure WordPress or custom CMS integration:
- WordPress REST API
- Custom webhook endpoints

## 📱 Usage

### 1. Create a Project
- Navigate to Dashboard
- Click "New Project"
- Enter website details and domain

### 2. Generate Content
- Go to AI SEO Writer
- Enter topic and keywords
- Configure language, tone, and length
- Generate AI-powered content

### 3. Optimize SEO
- Use AI SEO Editor to refine content
- Run SEO Agent to detect issues
- Fix problems automatically or manually

### 4. Automate Content
- Set up RSS feeds in Autoblog
- Create automation rules
- Schedule content publishing

### 5. Monitor Performance
- View analytics in Dashboard
- Track rankings and traffic
- Monitor SEO improvements

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Content
- `GET /api/content` - List content
- `POST /api/content` - Create content
- `GET /api/content/[id]` - Get content details
- `PUT /api/content/[id]` - Update content
- `DELETE /api/content/[id]` - Delete content

### AI Services
- `POST /api/ai/generate-content` - Generate AI content
- `POST /api/seo/analyze` - Analyze SEO issues

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- **Netlify**: Static export with serverless functions
- **Railway**: Full-stack deployment with PostgreSQL
- **DigitalOcean**: App Platform with managed database

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.seoflow.com](https://docs.seoflow.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/seotool/issues)
- **Discord**: [Join our community](https://discord.gg/seoflow)
- **Email**: support@seoflow.com

## 🎯 Roadmap

- [ ] Multi-language support for UI
- [ ] Advanced analytics dashboard
- [ ] White-label solution
- [ ] API rate limiting
- [ ] Content templates library
- [ ] Team collaboration features
- [ ] Advanced automation rules
- [ ] Integration marketplace

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Vercel for hosting platform
- Prisma for database toolkit
- Tailwind CSS for styling
- Next.js team for the framework

---

**Built with ❤️ for the SEO community**