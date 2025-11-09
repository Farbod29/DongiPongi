# DongyPongy 💰

A modern, full-stack expense splitting application built with Next.js. Split costs easily with friends and family on trips, events, and shared expenses.

## Features

### 🎯 Core Features
- **Spreadsheet-like Interface**: Excel-inspired expense table with editable percentages
- **Real-time Calculations**: Automatic debt/credit calculations for all participants
- **Trip Management**: Organize expenses by trips or events
- **Flexible Participants**: Add registered users or arbitrary participants (non-registered)
- **Smart Sharing**: Customize expense splits with percentage-based distribution

### 🌐 Internationalization
- **Bilingual Support**: English and Persian (Farsi) languages
- **RTL Support**: Proper right-to-left layout for Persian

### 🎨 User Experience
- **Dark/Light Theme**: Toggle between themes with persistent preference
- **Responsive Design**: Optimized for phone, tablet, and desktop
- **Clean UI**: Simple, intuitive interface easier than Excel
- **Locked Calculations**: View-only calculated shares to prevent accidental edits

### 🔐 Authentication
- Simple email/username/password authentication
- Secure password hashing with bcryptjs
- Session management with NextAuth.js

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js v5 (beta)
- **Internationalization**: next-intl

## Getting Started

### Prerequisites
- Node.js 20+
- Yarn 4+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd JLWC7
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
```bash
# .env file is already configured with:
# DATABASE_URL="file:./dev.db"
# AUTH_SECRET="<generated-secret>"
# NEXTAUTH_URL="http://localhost:3000"
```

4. Initialize the database:
```bash
yarn prisma migrate dev
```

5. Start the development server:
```bash
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating Your First Trip

1. **Register/Login**: Create an account or login
2. **Create Trip**: Click "New Trip" in the sidebar
3. **Add Participants**: 
   - Add registered users by email or username
   - Add arbitrary users (non-registered) by name
4. **Add Expenses**: Click "+ New Expense" and fill in:
   - Description (e.g., "Dinner at restaurant")
   - Amount in EUR
   - Date
   - Split percentages for each participant

### Managing Expenses

The expense table shows all columns from your Excel example:
- **Date**: When the expense occurred
- **Description**: What was purchased
- **Amount**: Total cost in EUR
- **Paid By**: Who paid for the expense
- **Participant Columns**: Each participant has:
  - **% Column** (Editable): Click to edit their share percentage
  - **Share Column** (Locked): Auto-calculated amount they owe

### Understanding the Summary

At the bottom of each trip, you'll see:
- **Total Cost**: Sum of all expenses
- **Per-Participant Balance**:
  - 🟢 Green (Positive): They are owed money
  - 🔴 Red (Negative): They owe money
  - ⚪ Gray (Zero): Settled up

### Editing Percentages

1. Click on any percentage cell in the table
2. Enter the new percentage
3. Press Enter or click outside to save
4. The system ensures all percentages total 100%

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── trips/        # Trip management
│   │   └── expenses/     # Expense management
│   ├── auth/             # Auth pages (login/register)
│   ├── dashboard/        # Main app pages
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── ExpenseTable.tsx  # Main spreadsheet component
├── contexts/             # React contexts
│   ├── ThemeContext.tsx
│   └── LocaleContext.tsx
├── lib/                  # Utilities
│   ├── auth.ts           # NextAuth configuration
│   └── prisma.ts         # Prisma client
├── i18n/                 # Internationalization
└── types/                # TypeScript types

prisma/
├── schema.prisma         # Database schema
└── migrations/           # Database migrations

messages/
├── en.json              # English translations
└── fa.json              # Persian translations
```

## Database Schema

- **User**: Authentication and user data
- **Trip**: Trip/event container
- **TripParticipant**: Links users to trips (supports arbitrary users)
- **Expense**: Individual expense records
- **ExpenseShare**: How each expense is split among participants

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Trips
- `GET /api/trips` - List all trips
- `POST /api/trips` - Create trip
- `GET /api/trips/[tripId]` - Get trip details
- `PATCH /api/trips/[tripId]` - Update trip
- `DELETE /api/trips/[tripId]` - Delete trip

### Participants
- `POST /api/trips/[tripId]/participants` - Add participant

### Expenses
- `POST /api/trips/[tripId]/expenses` - Create expense
- `PATCH /api/expenses/[expenseId]` - Update expense
- `DELETE /api/expenses/[expenseId]` - Delete expense

## Development

### Running Tests
```bash
yarn test
```

### Building for Production
```bash
yarn build
yarn start
```

### Database Management
```bash
# Create migration
yarn prisma migrate dev --name <migration-name>

# Reset database
yarn prisma migrate reset

# Open Prisma Studio
yarn prisma studio
```

## Features Roadmap

- [ ] Export to Excel/CSV
- [ ] Email notifications
- [ ] Multiple currencies
- [ ] Expense categories
- [ ] Receipt uploads
- [ ] Settlement suggestions
- [ ] Payment tracking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
