import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [spellCheck, setSpellCheck] = useState(null);
  const [topSearches, setTopSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchTopSearches();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8080/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchTopSearches = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/top-searches');
      setTopSearches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const performSearch = async (searchQuery) => {
    if (!searchQuery) return;
    setLoading(true);
    setSpellCheck(null);
    try {
      // 1. Search
      const res = await axios.get(`http://localhost:8080/api/search?query=${searchQuery}`);
      setProducts(res.data);

      // 2. Spell Check if no results or just to show suggestions
      const spellRes = await axios.get(`http://localhost:8080/api/spellcheck?word=${searchQuery}`);
      if (!spellRes.data.exists) {
        setSpellCheck(spellRes.data.suggestions);
      }

      fetchTopSearches();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleInputChange = async (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 1) {
      try {
        const res = await axios.get(`http://localhost:8080/api/autocomplete?prefix=${val}`);
        setSuggestions(res.data);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (word) => {
    setQuery(word);
    setSuggestions([]);
    performSearch(word);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Toothbrush Analyzer</h1>
        <div className="search-container">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder="Search for toothbrushes..."
            />
            <button type="submit">Search</button>
          </form>
          {isFocused && suggestions.length > 0 && (
            <ul className="autocomplete-list">
              {suggestions.map((s, i) => (
                <li key={i} onClick={() => handleSuggestionClick(s)}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <main>
        {spellCheck && spellCheck.length > 0 && (
          <div className="spell-check">
            <p>Did you mean: 
              {spellCheck.map((s, i) => (
                <span key={i} className="suggestion" onClick={() => {setQuery(s); setSpellCheck(null); performSearch(s);}}>{s} </span>
              ))}
            </p>
          </div>
        )}

        <div className="content-wrapper">
          <div className="product-list">
            {loading ? <p>Loading...</p> : products.map((p, i) => (
              <div key={i} className="product-card">
                <img src={p.imageUrl} alt={p.name} />
                <div className="product-info">
                  <h3>{p.name}</h3>
                  <p className="brand">{p.brand}</p>
                  <p className="price">{p.price}</p>
                  <p className="rating">Rating: {p.rating} ({p.reviewCount} reviews)</p>
                  <p className="desc">{p.description.substring(0, 100)}...</p>
                  <a href={p.productUrl} target="_blank" rel="noreferrer">View Product</a>
                </div>
              </div>
            ))}
          </div>

          <aside className="sidebar">
            <h3>Top Searches</h3>
            <ul>
              {topSearches.map((s, i) => (
                <li key={i}>{s.term}: {s.count}</li>
              ))}
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
