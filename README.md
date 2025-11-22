# Toothbrush Analyzer Project

This project is a React + Java application for analyzing and comparing electric toothbrushes.

## Project Structure

- `backend`: Spring Boot Java application.
- `frontend`: React application.
- `burst_products.csv`: Data source.

## Algorithms Implemented

1.  **Spell Checking**: Uses a **Trie** to store vocabulary and **Edit Distance** algorithm with **Sorting** to suggest alternative words.
2.  **Word Completion**: Uses a **Trie** (Prefix Tree) for efficient autocomplete.
3.  **Frequency Count**: Uses **Boyer-Moore** algorithm to count word occurrences in product descriptions.
4.  **Search Frequency**: Uses a **Red-Black Tree** (`TreeMap`) to track and sort search query frequencies.
5.  **Page Ranking**: Uses **Inverted Indexing** (via Trie) to find relevant products and **Boyer-Moore** + **Sorting** to rank them by keyword frequency.
6.  **Inverted Indexing**: Implemented within the Trie to map words to products for O(1) lookup.

## How to Run

### Backend

1.  Navigate to `backend` folder.
2.  Run `mvn spring-boot:run`.
3.  The server will start on `http://localhost:8080`.

### Frontend

1.  Navigate to `frontend` folder.
2.  Run `npm install` to install dependencies.
3.  Run `npm start` to start the React app.
4.  Open `http://localhost:3000` in your browser.

## Requirements

- Java 17+
- Maven
- Node.js & npm
