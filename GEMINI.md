# BilancioFamiliare

BilancioFamiliare is a family budget management application. It features a Ruby on Rails backend providing a RESTful API and an AngularJS frontend for a responsive user interface.

## Project Overview

*   **Architecture:** Rails 5.2.x Backend / AngularJS 1.8 Frontend (SPA).
*   **Backend Technologies:** Ruby on Rails, MySQL/MariaDB, ActionCable (Real-time updates), JWT (Authentication), Prometheus (Monitoring).
*   **Frontend Technologies:** AngularJS, Webpacker, Bootstrap 4, Chart.js (Data visualization).
*   **Key Models:**
    *   `Operation`: Individual financial transactions (income/expense).
    *   `Type`: Categories for operations, supporting hierarchical structures (master-types) and spending limits.
    *   `Withdrawal`: Cash withdrawals or specific bank movements.
    *   `User`: Application users with authentication.

## Building and Running

### Prerequisites

*   Ruby (version specified in `.ruby-version` or standard Rails 5.2 compatible, e.g., 2.6.x/2.7.x)
*   Node.js & Yarn
*   MySQL or MariaDB

### Installation

1.  **Install dependencies:**
    ```bash
    bundle install
    yarn install
    ```

2.  **Database Setup:**
    Ensure you have an `.env` file with `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_HOST`.
    ```bash
    bin/rails db:create
    bin/rails db:migrate
    bin/rails db:seed
    ```

### Development

1.  **Start the Rails server:**
    ```bash
    bin/rails s
    ```

2.  **Start Webpacker dev server (for frontend assets):**
    ```bash
    ./bin/webpack-dev-server
    ```

3.  **Run tests:**
    ```bash
    bin/rails test
    ```

### Docker

The project includes Docker support. To run using Docker Compose:
```bash
docker-compose up
```
*Note: Ensure `.env` is properly configured before running Docker.*

## Development Conventions

*   **Backend:** Standard Rails conventions. Models use `before_save` hooks to normalize date components (`year`, `month`, `day`) for efficient querying.
*   **Frontend:** AngularJS 1.8 using Webpacker. JavaScript source is located in `app/javascript/`.
*   **API/Auth:** The application uses JWT for authentication. The token is stored in `sessionStorage` and handled by `angular-jwt`.
*   **Naming:** Database tables and models use Italian names (e.g., `Bilancio`, `Operazioni` context, though model names like `Operation` and `Withdrawal` are English).

## Key Files

*   `app/models/`: Core business logic and data models.
*   `app/controllers/angular_controller.rb`: Entry point for the SPA.
*   `app/javascript/bilancio-familiare.js`: Frontend application entry point and module configuration.
*   `config/routes.rb`: API and frontend route definitions.
*   `docker-compose.yml`: Local development environment definition.
