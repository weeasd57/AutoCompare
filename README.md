# 🚗 AutoCompare - Smart Vehicle Comparison Platform

A modern, feature-rich vehicle comparison web application built with **Next.js 14**, **MySQL**, and **TailwindCSS**. Perfect for car dealerships, automotive websites, or anyone who wants to help users compare vehicles side-by-side.

![AutoCompare Preview](preview.png)

---

## ✨ Features

### 🏠 Frontend
- **Smart Vehicle Comparison** - Compare up to 4 vehicles side-by-side
- **Interactive Charts** - Visual comparison with Recharts
- **Search & Browse** - Find vehicles by make, model, or year
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Neo-Brutalism UI** - Modern, bold design style
- **Dark Mode** - Toggle between light and dark themes
- **PDF Export** - Export comparison results

### 🔧 Admin Panel
- **Vehicle Management** - Add, edit, delete vehicles
- **Bulk Operations** - Select and delete multiple vehicles
- **CSV Import** - Import vehicles from CSV files
- **Modern Delete Modal** - Confirmation dialogs
- **Search & Filter** - Find vehicles quickly
- **Secure Login** - Protected admin routes

### 🗄️ Database
- **MySQL Backend** - Reliable data storage
- **Full Vehicle Specs** - 30+ specification fields
- **Admin Accounts** - Secure user management

---

## 📋 Requirements

- **Node.js** 18.x or higher
- **MySQL** 5.7+ or MariaDB 10.3+
- **npm** or **yarn**

---

## 🚀 Installation

### 1. Clone or Extract

```bash
# If using git
git clone <repository-url>
cd autocompare

# Or extract the ZIP file
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Database Setup

1. Create a new MySQL database:
```sql
CREATE DATABASE autocompare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Import the database schema:
```bash
mysql -u root -p autocompare < database.sql
```

Or import `database.sql` via phpMyAdmin.

### 4. Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=autocompare
```

### 5. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Visit `http://localhost:3000` to see the application.

---

## 🔐 Admin Access

### First Time Setup
Visit `/setup` to create your admin account. This is required before accessing the admin panel.

### Admin Routes
- `/admin/login` - Admin login page
- `/admin/dashboard` - Vehicle management
- `/admin/add` - Add new vehicle
- `/admin/edit/[id]` - Edit vehicle
- `/admin/import` - Import from CSV

---

## 📁 Project Structure

```
autocompare/
├── src/
│   ├── app/
│   │   ├── admin/           # Admin panel pages
│   │   ├── api/             # API routes
│   │   ├── compare/         # Comparison page
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   ├── context/             # React context providers
│   ├── lib/                 # Utility functions
│   ├── store/               # Zustand store
│   └── types/               # TypeScript types
├── public/                  # Static assets
├── database.sql             # Database schema
├── .env.example             # Environment template
└── README.md                # This file
```

---

## 📊 CSV Import Format

When importing vehicles via CSV, use these column headers:

| Column | Required | Description |
|--------|----------|-------------|
| make | ✅ | Brand name (e.g., Ford, Toyota) |
| model | ✅ | Model name (e.g., Camry, F-150) |
| year | ✅ | Year (e.g., 2024) |
| trim | ❌ | Trim level (e.g., XLT, SE) |
| base_price | ❌ | Price in USD |
| horsepower | ❌ | Engine horsepower |
| fuel_combined_mpg | ❌ | Combined MPG |
| drivetrain | ❌ | FWD, RWD, AWD, 4WD |
| seating_capacity | ❌ | Number of seats |
| body_style | ❌ | Sedan, SUV, Truck, etc. |
| image_url | ❌ | URL to vehicle image |

### Example CSV:
```csv
make,model,year,trim,base_price,horsepower,fuel_combined_mpg,drivetrain,seating_capacity
Ford,Maverick,2025,XLT,28995,250,26,FWD,5
Toyota,Camry,2024,SE,27500,203,32,FWD,5
```

---

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to change the color scheme.

### Logo
Replace `public/logo.png` with your own logo.

### Branding
Update `src/app/layout.tsx` for site title and metadata.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** TailwindCSS
- **Database:** MySQL with mysql2
- **State:** Zustand
- **Charts:** Recharts
- **Icons:** Lucide React
- **PDF:** jsPDF + html2canvas

---

## 📄 License

This item is sold under the CodeCanyon Regular or Extended License.

---

## 🆘 Support

For support, please contact us through CodeCanyon or email support@example.com.

---

## 📝 Changelog

### v1.0.0 (Initial Release)
- Vehicle comparison functionality
- Admin panel with CRUD operations
- CSV import feature
- Bulk delete with modern modals
- Responsive design
- MySQL database integration
