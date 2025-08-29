# WalletProject: Financial Management Application

A full-stack web application designed for personal financial management. It provides users with tools to track their accounts, manage transactions, and view their financial activity, while also offering a separate administrative interface for managing the platform's users and data.

## Features

### User-Facing Application
- **Authentication**: Secure user registration and login using JWT.
- **Dashboard**: An overview of the user's financial status, including recent transactions and account balances.
- **Account Management**: View and manage multiple financial accounts.
- **Transaction Tracking**: Log, view, and categorize income and expenses.
- **Fund Transfers**: A dedicated interface for transferring funds.
- **User Settings**: Customize application settings, such as theme and timezone.
- **Data Visualization**: Interactive charts to visualize financial data.

### Admin Panel
- **User Management**: View and manage all registered users on the platform.
- **Account Management**: Administrative oversight of all user accounts.
- **Transaction Management**: View and manage all transactions across the system.

## Tech Stack

### Backend
- **Framework**: .NET 8 Web API (C# 12)
- **Database**: SQLite
- **ORM**: Entity Framework Core 9
- **Authentication**: JWT (JSON Web Tokens)
- **API Testing**: Swagger/OpenAPI is implicitly available through .NET Web API templates.

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Bundler**: Vite
- **Routing**: React Router
- **Styling**: Tailwind CSS & Styled Components
- **Charting**: Recharts
- **Icons**: Lucide React

## Project Structure

The project is organized into two main parts: the .NET backend and the React frontend (`ClientApp`).

```
/
├── ClientApp/              # React frontend source code
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   │   ├── admin-page/ # Components for the admin panel
│   │   │   └── user-app/   # Components for the main user application
│   │   ├── contexts/       # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API communication layer
│   │   └── utils/          # Utility functions
│   ├── vite.config.ts      # Vite configuration
│   └── package.json        # Frontend dependencies
│
├── Src/                    # .NET backend source code
│   ├── Controllers/        # API controllers
│   ├── Database/           # DbContext and entity configurations
│   ├── Entities/           # C# data models
│   ├── Repositories/       # Data access layer
│   └── Services/           # Business logic
│
├── Migrations/             # Entity Framework database migrations
├── WalletProject.csproj    # .NET project file
└── appsettings.json        # Backend configuration
```

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- **.NET 8 SDK**: [Download & Install .NET 8](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js**: [Download & Install Node.js](https://nodejs.org/) (which includes npm)
- **Yarn (Optional)**: [Install Yarn](https://classic.yarnpkg.com/en/docs/install/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/burakozturk01/WalletProject.git
    cd WalletProject
    ```

2.  **Install backend dependencies:**
    The .NET dependencies are restored automatically when you build or run the project.

3.  **Install frontend dependencies:**
    Navigate to the `ClientApp` directory and install the required packages. The project is configured to use either `yarn` or `npm`.
    ```bash
    cd ClientApp
    yarn install
    # OR
    npm install
    cd .. 
    ```
    *Note: The project is set up to automatically run this command during the first build if the `node_modules` directory is missing.*

### Configuration

The application uses `appsettings.json` for backend configuration.

1.  **Backend Configuration (`appsettings.json`):**
    The primary configuration file is `appsettings.json`. For development, you can create `appsettings.Development.json` to override settings. A key setting to configure is the JWT secret.

    **Example `appsettings.Development.json`:**
    ```json
    {
      "Logging": {
        "LogLevel": {
          "Default": "Information",
          "Microsoft.AspNetCore": "Warning"
        }
      },
      "Jwt": {
        "Key": "REPLACE_WITH_A_VERY_LONG_AND_SECURE_SECRET_KEY",
        "Issuer": "https://localhost:5001",
        "Audience": "https://localhost:5001"
      }
    }
    ```
    **Important**: Replace the `Jwt:Key` with a strong, unique secret key.

2.  **Database Setup:**
    The application uses Entity Framework Core migrations to manage the database schema. The database will be created and migrations will be applied automatically on the first run. The connection string in `appsettings.json` points to a local SQLite database file (`wallet.db`).

### Running the Application

You can run the entire full-stack application with a single command from the root directory:

```bash
dotnet run
```

This command will:
1.  Start the .NET backend API.
2.  Start the Vite development server for the React frontend.
3.  Open your default web browser to the application.

The backend will typically run on `https://localhost:5001` or a similar port, and the frontend will be served by Vite on a different port (e.g., `http://localhost:3000`), with requests automatically proxied to the backend.

## Troubleshooting

- **Node.js is required error during build:**
  This means Node.js is not installed or not available in your system's PATH. Please install it from [nodejs.org](https://nodejs.org/).

- **Frontend not updating after changes:**
  Ensure the Vite dev server is running. If you ran `dotnet run`, it should be active. Check your terminal for any error messages from Vite. You may need to refresh your browser cache.

- **Database connection issues:**
  Ensure the path for the SQLite database in `appsettings.json` is writable by your user account. If you encounter migration errors, you can try deleting the `.db` file and restarting the application to recreate it from scratch.

- **Authentication Errors (401 Unauthorized):**
  - Check that the JWT key in `appsettings.Development.json` is set and is sufficiently long and complex.
  - Ensure the token is not expired.
  - Clear site data (cookies, local storage) in your browser and log in again.
