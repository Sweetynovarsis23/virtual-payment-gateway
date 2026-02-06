# Virtual Payment Gateway - Frontend

React-based dashboard for the Virtual Payment Gateway demo system.

## Features

- 🔐 User authentication (Login/Register)
- 💰 Wallet balance display with virtual account
- 💸 Pay-in (Add money) functionality
- 💳 Payout (Send money) functionality
- 🏛️ Government tax payment
- 📜 Complete transaction history
- 📊 Dashboard with stats
- 🎨 Modern, responsive UI

## Tech Stack

- **React 18** with Vite
- **React Router** for navigation
- **Axios** for API calls
- **Context API** for state management
- **CSS3** with modern styling

## Installation

### Prerequisites

- Node.js v18 or higher
- Backend API running (see backend README)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## API Integration

The frontend connects to the backend API at `http://localhost:5000/api`.

Update the API base URL in `src/services/api.js` if needed.

## Available Routes

- `/login` - User login
- `/register` - User registration
- `/dashboard` - Main dashboard
- `/payin` - Add money to wallet
- `/payout` - Send money from wallet
- `/pay-tax` - Pay government tax
- `/history` - Transaction history

## Building for Production

```bash
npm run build
```

## License

ISC
