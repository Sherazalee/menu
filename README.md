# Saffron & Stone — Restaurant Menu Website

A modern, responsive, database-powered restaurant website built with **Next.js, Tailwind CSS, and NeonDB PostgreSQL**.

Saffron & Stone features an elegant restaurant interface with a fully dynamic menu. Users can view, add, edit, and delete menu items. All changes are saved in NeonDB and remain available after refreshing the website.

This project was developed as part of the **Next.js + NeonDB Dynamic Websites Practical Assignment**.

## Features

- **Dynamic Menu:** Display restaurant menu items retrieved directly from NeonDB.
- **Add Menu Items:** Add dishes using a form with name, price, and description.
- **Edit Menu Items:** Update existing dish information.
- **Delete Menu Items:** Remove dishes with a confirmation prompt.
- **Persistent Storage:** Menu changes remain saved after refreshing the page.
- **Live Search:** Search dishes by name or description.
- **Sorting:** Sort menu items by price, name, or newest first.
- **Responsive Design:** Optimized for desktop, tablet, and mobile screens.
- **Modern UI:** Elegant typography, carefully selected colours, and subtle hover effects.
- **API Integration:** Next.js route handlers communicate with NeonDB.

## Technologies Used

| Technology | Purpose |
|---|---|
| Next.js | Full-stack React framework |
| TypeScript | Type-safe application development |
| React | Interactive user interface |
| Tailwind CSS | Responsive styling |
| NeonDB | PostgreSQL database |
| Neon Serverless Driver | Database connectivity |
| Lucide React | Icons |
| Vercel | Deployment platform |

## Project Structure

```text
menu/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── menu/
│   │   │       ├── route.ts
│   │   │       └── [id]/
│   │   │           └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       └── db.ts
├── public/
├── .env.local
├── package.json
└── README.md
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

Navigate to the project folder:

```bash
cd YOUR_REPOSITORY
```

Replace the example GitHub URL and folder name with your actual repository details.

### 2. Install Dependencies

```bash
npm install
```

Install the required additional packages if they are not already installed:

```bash
npm install @neondatabase/serverless lucide-react
```

### 3. Set Up NeonDB

1. Visit https://neon.tech.
2. Create a NeonDB project.
3. Open the SQL Editor.
4. Execute the following SQL statement:

```sql
CREATE TABLE IF NOT EXISTS menu_items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Insert Sample Menu Items (Optional)

```sql
INSERT INTO menu_items (name, price, description)
VALUES
('Truffle Mushroom Pasta', 1890, 'Creamy parmesan sauce, sautéed mushrooms, black truffle and fresh herbs.'),
('Signature Grilled Chicken', 1650, 'Tender chicken breast, rosemary potatoes, seasonal vegetables and garlic jus.'),
('Classic Beef Burger', 1490, 'Juicy beef patty, mature cheddar, caramelised onions and house-made sauce.'),
('Margherita Pizza', 1590, 'Stone-baked crust, San Marzano tomato, fresh mozzarella and basil.'),
('Garden Fresh Salad', 950, 'Mixed greens, cherry tomatoes, avocado, toasted seeds and lemon dressing.'),
('Chocolate Lava Cake', 850, 'Warm dark chocolate fondant with a soft centre and vanilla ice cream.');
```

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory.

Add your NeonDB connection string:

```env
DATABASE_URL="your_neondb_connection_string"
```

Replace the placeholder with your actual NeonDB database URL.

**Security:** Never upload `.env.local` to GitHub or expose database credentials publicly.

Make sure `.env.local` is included in `.gitignore`.

### 6. Run the Development Server

```bash
npm run dev
```

Open the following URL:

http://localhost:3000

The website should now be running locally.

## API Endpoints

The application uses Next.js API route handlers to perform database operations.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/menu` | Retrieve all menu items |
| POST | `/api/menu` | Add a new menu item |
| PATCH | `/api/menu/:id` | Update an existing menu item |
| DELETE | `/api/menu/:id` | Delete a menu item |

### Example POST Request

```json
{
  "name": "Grilled Chicken Pasta",
  "price": 1450,
  "description": "Creamy pasta served with grilled chicken and herbs."
}
```

## How the Website Works

**1. Display Menu**

When the homepage loads, the application sends a GET request to `/api/menu`. The API retrieves menu records from NeonDB and displays them as menu cards.

**2. Add Menu Item**

Users can click the "Add New Dish" button and enter the dish name, price, and description. A POST request saves the new item to NeonDB.

**3. Edit Menu Item**

Clicking the edit icon opens a form populated with the existing item's details. A PATCH request updates the corresponding NeonDB record.

**4. Delete Menu Item**

Clicking the delete icon displays a confirmation prompt. After confirmation, a DELETE request removes the selected item from NeonDB.

**5. Data Persistence**

Menu items are stored in PostgreSQL rather than browser memory. Changes remain available after refreshing or reopening the website.

## Screenshots

Add screenshots of the completed application to the `screenshots` folder.

### Homepage

![Restaurant Homepage](screenshots/homepage.png)

### Dynamic Menu

![Dynamic Menu](screenshots/menu.png)

### Add Menu Item

![Add Menu Item](screenshots/add-item.png)

### Edit Menu Item

![Edit Menu Item](screenshots/edit-item.png)

### Delete Menu Item

![Delete Menu Item](screenshots/delete-item.png)

Screenshots should show the working website and demonstrate the CRUD operations.

## Deployment on Vercel

The application can be deployed using Vercel.

1. Push the project to GitHub.
2. Visit https://vercel.com.
3. Import the GitHub repository.
4. Add `DATABASE_URL` under project environment variables.
5. Deploy the application.
6. Verify that adding, editing, and deleting menu items work on the deployed website.

### Live Website

**Live Demo:** Add your Vercel deployment URL here.

**GitHub Repository:** Add your GitHub repository URL here.

## Testing

The application should be tested using the following steps:

- [ ] Menu items load successfully from NeonDB.
- [ ] New menu items can be added.
- [ ] Existing menu items can be edited.
- [ ] Menu items can be deleted.
- [ ] Changes remain after refreshing the browser.
- [ ] Search and sorting work correctly.
- [ ] The website displays correctly on mobile devices.
- [ ] The deployed application connects successfully to NeonDB.

## Assignment Requirements

| Requirement | Implementation |
|---|---|
| Display menu items | NeonDB records displayed dynamically |
| Add menu items | React form and POST API |
| Delete menu items | DELETE API with confirmation |
| Database persistence | NeonDB PostgreSQL |
| Next.js App Router | Used throughout the application |
| React hooks | useState, useEffect, useMemo |
| Styling | Tailwind CSS and custom CSS |
| Additional functionality | Edit, search, and sorting |

## Future Improvements

Possible improvements for a production version include:

- Admin authentication and authorization
- Restaurant menu categories
- Food images
- Online ordering
- Table reservations
- Role-based menu management

These features are outside the scope of the current practical assignment.

## Project Information

**Project Name:** Saffron & Stone — Restaurant Menu Website

**Project Type:** Full-Stack Web Application

**Database:** NeonDB PostgreSQL

**Framework:** Next.js App Router

**Purpose:** Academic Practical Assignment

---

Developed using Next.js, React, TypeScript, Tailwind CSS, and NeonDB.