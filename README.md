# SmartStack 🚀

Welcome to SmartStack! This project is a modern, full-stack boilerplate designed to accelerate your development process. It comes pre-configured with a powerful stack of technologies, allowing you to focus on building features rather than on setup.

## ✨ Features

SmartStack integrates a selection of popular and efficient tools:

- **Frontend**:
  - [**Vite**](https://vitejs.dev/): A next-generation, blazing-fast frontend build tool.
  - [**React**](https://react.dev/): A JavaScript library for building user interfaces.
  - [**Recharts**](https://recharts.org/): A composable charting library built on React components.
- **Backend**:
  - [**Supabase**](https://supabase.io/): An open-source Firebase alternative for building secure and scalable backends. It provides a Postgres database, authentication, instant APIs, and more.
- **Styling**:
  - _(You can add your styling solution here, e.g., Tailwind CSS, Shadcn/ui, etc.)_

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/en/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) or your favorite package manager (e.g., yarn, pnpm)

## 🚀 Getting Started

Follow these steps to get your local development environment up and running.

### 1. Clone the Repository

```bash
git clone https://github.com/codebydj/smartstack.git
cd smartstack
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

This project uses [Supabase](https://supabase.io/) for its backend. You'll need to create a project on Supabase to get your API keys.

1.  Create a `.env` file in the root of the project by copying the example file:

    ```bash
    cp .env.example .env
    ```

    _(If you don't have a `.env.example` file, you can create `.env` manually.)_

2.  Log in to your Supabase dashboard and find your project's API URL and `anon` public key in **Project Settings > API**.

3.  Add your Supabase credentials to the `.env` file:

    ```
    VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
    VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

> **Note**: The `VITE_` prefix is required for Vite to expose these variables to your client-side code.

## 💻 Usage

### Running the Development Server

To start the local development server with hot-reloading:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

### Building for Production

To create a production-ready build of your application:

```bash
npm run build
```

This command will generate a `dist` directory with the optimized static assets.

## 🤝 Contributing

Contributions are welcome! If you have suggestions or want to improve the code, please feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
