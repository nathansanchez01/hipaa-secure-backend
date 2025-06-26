# Secure Patient Intake System - Backend

This directory contains the backend for the Secure Patient Intake System, a full-stack application built with Node.js, Express, and TypeScript. It provides a secure API for managing patient records, user authentication, and audit logging.

## Features

-   **Authentication & Authorization**:
    -   Secure user signup and login with password hashing using `bcrypt`.
    -   Role-Based Access Control (RBAC) with two roles: `admin` and `clinician`.
    -   Protected API endpoints using JWT-based middleware to ensure proper authentication and role permissions.

-   **Patient Record Management**:
    -   Clinicians can create new patient records, including sensitive information like SSN.
    -   Admins can view a list of all patient records with all data unmasked.
    -   Clinicians can only view the patients they have created.
    -   For clinicians, patients' Social Security Numbers (SSNs) are automatically masked (e.g., `XXX-XX-1234`) for privacy.
    -   Prevents creation of patients with duplicate SSNs.

-   **Audit Logging**:
    -   Automatically logs critical actions such as `create_patient` and `view_patient_data`.
    -   Each audit log entry includes the user who performed the action, their role, the action details, the affected patient, and a timestamp.
    -   A secure, admin-only endpoint is available to review all audit logs.

-   **Tech Stack**:
    -   **Framework**: Node.js with Express.js
    -   **Language**: TypeScript
    -   **Database**: SQLite via `better-sqlite3`
    -   **ORM**: Drizzle ORM for database queries and schema management.
    -   **Testing**: Jest and Supertest for API endpoint testing.
    -   **Module System**: Configured with ES Modules.

## Project Setup

Follow these steps to set up and run the backend server locally.

### 1. Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 2. Installation

Navigate to the `backend` directory and install the required dependencies:

```bash
cd backend
npm install
```

### 3. Database Setup

The project uses Drizzle ORM to manage the database schema. The database is a simple SQLite file (`sqlite.db`).

To create the database and all necessary tables (`users`, `patients`, `audit_logs`), run the Drizzle migration command:

```bash
npx drizzle-kit push
```
This command reads the schema definition from `src/db/schema.ts` and applies it to the SQLite database.

### 4. Seeding the Admin User

The application signup form only allows the creation of "clinician" roles. The first "admin" user must be created manually. While a dedicated seed script is pending, you can add one by temporarily modifying the `src/api/auth.ts` file to allow admin registration and restarting the server.

### 5. Running the Development Server

To start the server in development mode with hot-reloading (powered by `tsx`):

```bash
npm run dev
```

The server will start on `http://localhost:3000`.

### 6. Running Tests

To run the automated tests for the API endpoints:

```bash
npm test
```

This will execute all test files located in the `src/api/__tests__` directory using Jest and Supertest. 