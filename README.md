# Trusta - E-Commerce Product Verification Platform

A modern, fully-featured e-commerce platform built with Next.js, featuring product authentication verification, seller trust scores, and verified buyer reviews.

## 🎯 Features

### Public Website Features

#### Landing Page
- ✅ Modern homepage with hero section
- ✅ Featured products showcase
- ✅ Trending verified products section
- ✅ Brand trust messaging and statistics
- ✅ Verified seller showcase
- ✅ Product authenticity explanation (4-step process)

#### Product Catalog
- ✅ Browse all products with grid layout
- ✅ Category filtering (Electronics, Automotive, Furniture, Appliances, etc.)
- ✅ Full-text search functionality
- ✅ Price range filtering
- ✅ Availability filtering
- ✅ Verified-only product filter
- ✅ Seller verification badge display
- ✅ Sorting options (Featured, Trending, Price, Newest)
- ✅ Pagination support

#### Product Detail Page
- ✅ Multiple product images with gallery
- ✅ Detailed product description
- ✅ Comprehensive specifications display
- ✅ Unit availability tracking
- ✅ Serialized inventory count display
- ✅ Complete seller details and link
- ✅ Authenticity verification badge
- ✅ Trust score percentage
- ✅ Verified buyer review count
- ✅ Customer reviews with ratings
- ✅ Add to cart functionality


#### Seller Pages
- ✅ Detailed seller profile/store page
- ✅ Seller statistics (products, reviews, trust score)
- ✅ Seller products listing
- ✅ Trust score breakdown
- ✅ Verified status badge
- ✅ Contact information
- ✅ Seller policies display

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **UI Components**: Lucide React Icons
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios

## 📦 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── products/          # Product API routes
│   │   ├── sellers/           # Seller API routes
│   │   ├── reviews/           # Review API routes
│   │   └── auth/              # Authentication routes
│   ├── products/              # Products catalog page
│   ├── product/[id]/          # Product detail page
│   ├── seller/[id]/           # Seller profile page
│   ├── page.tsx               # Landing page
│   └── layout.tsx             # Root layout
├── components/                # React components
│   ├── Header.tsx             # Navigation header
│   ├── Footer.tsx             # Footer
│   ├── ProductCard.tsx        # Product card component
│   └── FilterSidebar.tsx      # Product filters
├── lib/
│   ├── db.ts                  # MongoDB connection
│   └── auth.ts                # Authentication utilities
├── models/                    # MongoDB schemas
│   └── index.ts               # All models
└── types/
    └── index.ts               # TypeScript types
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment variables**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/trusta
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

3. **Set up MongoDB**

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Add to `.env.local`

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 API Documentation

### Products

#### Get All Products
```
GET /api/products?category=electronics&minPrice=100&maxPrice=1000&verified=true&sortBy=featured&page=1
```

#### Get Product Details
```
GET /api/products/[id]
```

### Reviews

#### Get Product Reviews
```
GET /api/reviews?productId=[productId]
```

#### Create Review
```
POST /api/reviews
Body: {
  productId: string
  userId: string
  rating: number (1-5)
  comment: string
}
```

### Sellers

#### Get Seller Details
```
GET /api/sellers/[id]
```

## 🎨 Customization

### Adding More Categories
Edit `src/components/FilterSidebar.tsx`:
```typescript
const CATEGORIES = ['Electronics', 'Automotive', 'Furniture', 'Appliances', 'Jewelry', 'Fashion'];
```

### Changing Colors
Tailwind configuration in `tailwind.config.ts` - modify color scheme for your brand.

### Product Images
Currently using placeholder images. Replace with actual image URLs or implement image upload functionality.

## 🔐 Authentication & Security

- Password hashing with bcryptjs
- JWT token-based authentication
- Secure API routes with middleware
- MongoDB injection protection via Mongoose

## 📊 Sample Data

To populate the database with sample products and sellers, you can:

1. Use the MongoDB client to insert sample documents
2. Create a seed script in `src/lib/seed.ts`
3. Call it on app initialization

## 🔄 Database Models

### Product
- name, description, category
- price, images, serial number
- specifications, quantity
- seller info with verification
- authenticity details
- trust score, trending/featured flags

### Seller
- name, email, password
- verification status and date
- trust score and review count
- description, logo, website

### Review
- productId, userId
- rating (1-5), comment
- verification status
- helpful count

### User
- email, name, password
- verification status
- timestamps


## 🚢 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

```bash
npm run build
npm start
```

### Deploy to Other Platforms

Ensure these environment variables are set:
- `MONGODB_URI`
- `JWT_SECRET`
- `NEXT_PUBLIC_API_URL`

## 📈 Performance Optimizations

- Image optimization with Next.js Image component
- Server-side rendering for better SEO
- API route caching
- Database query indexing on frequently searched fields

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env.local`
- Verify network access if using Atlas

### API Routes Not Working
- Check that middleware is properly configured
- Verify request headers (especially Authorization)
- Check MongoDB connection

### Styling Issues
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Restart dev server

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📄 License

MIT License

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@trusta.com
- Documentation: https://docs.trusta.com

## 🎓 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

**Built with ❤️ for transparent, trustworthy e-commerce**
