# GitHub Issues Tracker

A vanilla HTML, CSS and JavaScript project built for Assignment-05. The project matches the provided UI style and includes the required interactions: login, tab filtering, search, loading state, card modal details and responsive layout.

## Live Features

- Demo login with fixed credentials
- Fetch all issues from the provided API
- Filter by All, Open and Closed
- Search issues with the search API
- Dynamic issue count
- Status-based top border color on cards
- Loading spinner while fetching data
- Click any card to open issue details in a modal
- Responsive grid for desktop, tablet and mobile

## Demo Credentials

- Username: `admin`
- Password: `admin123`

## Project Structure

- `index.html` → main markup
- `styles.css` → page styling and responsive layout
- `app.js` → API calls and all interactive behavior
- `README_NOTE.md` → answers to the required theory questions

## How to Run

1. Download or clone the project.
2. Open the folder in VS Code.
3. Run with Live Server or open `index.html` in your browser.
4. Log in with the demo credentials.

## API Endpoints Used

- All issues: `https://phi-lab-server.vercel.app/api/v1/lab/issues`
- Single issue: `https://phi-lab-server.vercel.app/api/v1/lab/issue/{id}`
- Search issues: `https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q={text}`

## Suggested Commit Plan

1. setup base files and project structure
2. build login page layout
3. add dashboard navbar and filter tabs
4. fetch and render issues from api
5. add issue cards and responsive grid
6. implement modal details view
7. add search and loading spinner
8. refine styles and write readme notes
