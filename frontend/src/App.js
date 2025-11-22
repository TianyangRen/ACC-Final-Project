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
  const [sort, setSort] = useState('default');
  const [showNav, setShowNav] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchTopSearches();
  }, []);

  const fetchProducts = async (sortOption = sort) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8080/api/products?sort=${sortOption}`);
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

  const performSearch = async (searchQuery, sortOption = sort) => {
    if (!searchQuery) return;
    setLoading(true);
    setSpellCheck(null);
    try {
      // 1. Search
      const res = await axios.get(`http://localhost:8080/api/search?query=${searchQuery}&sort=${sortOption}`);
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

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSort(newSort);
    if (query) {
      performSearch(query, newSort);
    } else {
      fetchProducts(newSort);
    }
  };

  const handleShowAll = () => {
    setQuery('');
    setSuggestions([]);
    setSpellCheck(null);
    fetchProducts(sort);
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
      <header className={`App-header ${showNav ? '' : 'hidden'}`}>
        <h1>Toothbrush Analyzer</h1>
        <div className="search-container">
          <button className="show-all-btn" onClick={handleShowAll}>All</button>
          <select value={sort} onChange={handleSortChange} className="sort-select">
            <option value="default">Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
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
                <li key={i} onClick={() => handleSuggestionClick(s.term)}>
                  <span>{s.term}</span>
                  <span>{s.count}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
