# Wegesa Event Co - Inventory Management System

A modern, responsive inventory and asset movement tracking system built for event rental companies. This frontend-only prototype demonstrates a complete inventory management workflow with role-based access control.

## 🚀 Features

### Core Functionality
- **Inventory Management**: Add, edit, and track items across multiple store locations
- **Movement Tracking**: Create dispatches, track rentals, and manage returns
- **Role-Based Access**: Three distinct user roles with appropriate permissions
- **Real-time Analytics**: Comprehensive reporting with charts and export capabilities
- **Dark/Light Mode**: Beautiful theme switching with black and white design

### User Roles
- **Super Admin**: Full system access, user management, settings configuration
- **Operation**: Create dispatches, manage rentals, view reports
- **Store Keeper**: Manage inventory, confirm returns, limited dispatch access

### Technical Features
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **State Management**: Zustand for efficient client-side state management
- **Data Export**: Excel export functionality for reports
- **Form Validation**: Comprehensive validation with user-friendly error messages

## 🛠 Tech Stack

- **Framework**: Next.js 15.4.6 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Heroicons
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Export**: XLSX, file-saver

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wegesa-mgt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Quick Start

### Demo Users
The system comes with pre-configured demo users:

| Name | Email | Role | Password |
|------|--------|------|----------|
| Asha M. | asha@wagesa.co | Super Admin | (Click quick login) |
| Jonas K. | jonas@wagesa.co | Operation | (Click quick login) |
| Neema D. | neema@wagesa.co | Store Keeper | (Click quick login) |

### First Steps
1. **Login**: Use the splash page to navigate to login
2. **Dashboard**: View key metrics and quick actions
3. **Inventory**: Add some items to get started
4. **Movements**: Create your first dispatch
5. **Reports**: Generate analytics and export data

## 📱 User Interface

### Design Principles
- **Minimalist**: Clean, focused design with black and white theme
- **Accessible**: High contrast, clear typography, keyboard navigation
- **Responsive**: Mobile-first design that scales beautifully
- **Intuitive**: Logical navigation with breadcrumbs and clear actions

### Key Pages
- **Dashboard**: Overview with KPIs and quick actions
- **Inventory**: Item management with search and filtering
- **Movements**: Dispatch creation and tracking
- **Reports**: Analytics with charts and export options
- **Users**: User management (Super Admin only)
- **Settings**: System configuration (Super Admin only)

## 🔐 Permissions Matrix

| Feature | Super Admin | Operation | Store Keeper |
|---------|-------------|-----------|--------------|
| View Dashboard | ✅ | ✅ | ✅ |
| View Inventory | ✅ | ✅ | ✅ |
| Add/Edit Items | ✅ | ➖ (edit qty) | ✅ |
| Delete Items | ✅ | ❌ | ❌ |
| Create Dispatch | ✅ | ✅ | ❌ |
| Authorize Dispatch | ✅ | ✅ | ❌ |
| Register Returns | ✅ | ✅ | ✅ |
| View Reports | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |

## 📊 Data Model

### Core Entities
- **Items**: Inventory items with quantities and locations
- **Movements**: Dispatches and rentals with customer information
- **Returns**: Return records with quantities and dates
- **Users**: System users with roles and permissions

### Business Logic
- Stock levels automatically adjust with dispatches and returns
- Overdue tracking based on expected return dates
- Role-based UI rendering and action availability
- Real-time statistics calculation

## 🚧 Development Notes

### Current Limitations
- **Frontend Only**: No backend or database (data resets on refresh)
- **Mock Authentication**: Simple role selection without real security
- **In-Memory Storage**: All data stored in browser memory
- **No Persistence**: Data is lost when the page is refreshed

### Future Enhancements
- Backend API integration
- Real authentication and authorization
- Database persistence
- Real-time notifications
- Advanced reporting features
- Mobile app companion

## 🎨 Customization

### Theme
The system uses a black and white theme with support for dark/light modes. Colors can be customized in `app/globals.css`:

```css
:root {
  --primary: 0 0% 9%;
  --secondary: 0 0% 96.1%;
  /* ... other variables */
}
```

### Components
All UI components are built with shadcn/ui and can be customized in the `components/ui/` directory.

## 📈 Performance

- **Optimized Bundle**: Tree-shaking and code splitting
- **Fast Navigation**: Client-side routing with Next.js
- **Efficient State**: Zustand for minimal re-renders
- **Responsive Images**: Next.js Image optimization
- **Lazy Loading**: Components loaded on demand

## 🧪 Testing

The system has been manually tested across:
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Devices**: Desktop, tablet, mobile
- **Roles**: All three user roles with their permissions
- **Workflows**: Complete inventory and movement workflows

## 📝 License

This project is part of a portfolio demonstration and is not licensed for commercial use.

## 🤝 Contributing

This is a demonstration project. For suggestions or improvements, please contact the developer.

---

**Built with ❤️ for Wegesa Event Co**

*A modern solution for inventory management in the events industry.*# wagesa
