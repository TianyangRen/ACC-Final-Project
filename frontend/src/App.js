import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import LoginModal from './components/LoginModal';

function App() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [spellCheck, setSpellCheck] = useState(null);
  const [topSearches, setTopSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sorts, setSorts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showNav, setShowNav] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isBrandOpen, setIsBrandOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState(null);
  const brandRef = useRef(null);
  const typeRef = useRef(null);
  const itemsPerPage = 15;

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
    fetchBrands();
    fetchTypes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (brandRef.current && !brandRef.current.contains(event.target)) {
        setIsBrandOpen(false);
      }
      if (typeRef.current && !typeRef.current.contains(event.target)) {
        setIsTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/brands');
      setBrands(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/types');
      setTypes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async (sortOptions = sorts, brandFilters = selectedBrands, typeFilters = selectedTypes) => {
    setLoading(true);
    try {
      const params = { sort: sortOptions.length > 0 ? sortOptions.join(',') : 'default' };
      if (brandFilters.length > 0) {
        params.brands = brandFilters.join(',');
      }
      if (typeFilters.length > 0) {
        params.types = typeFilters.join(',');
      }
      const res = await axios.get(`http://localhost:8080/api/products`, { params });
      setProducts(res.data);
      setCurrentPage(1);
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

  const performSearch = async (searchQuery, sortOptions = sorts, brandFilters = selectedBrands, typeFilters = selectedTypes) => {
    if (!searchQuery) return;
    setLoading(true);
    setSpellCheck(null);
    try {
      const params = { query: searchQuery, sort: sortOptions.length > 0 ? sortOptions.join(',') : 'default' };
      if (brandFilters.length > 0) {
        params.brands = brandFilters.join(',');
      }
      if (typeFilters.length > 0) {
        params.types = typeFilters.join(',');
      }
      // 1. Search
      const res = await axios.get(`http://localhost:8080/api/search`, { params });
      setProducts(res.data);
      setCurrentPage(1);

      // 2. Spell Check if no results or just to show suggestions
      const spellRes = await axios.get(`http://localhost:8080/api/spellcheck`, {
        params: { word: searchQuery }
      });
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

  const toggleSort = (field) => {
    let newSorts = [...sorts];
    const existingIndex = newSorts.findIndex(s => s.startsWith(field));

    if (existingIndex >= 0) {
      const currentSort = newSorts[existingIndex];
      if (currentSort.endsWith('_asc')) {
        newSorts[existingIndex] = `${field}_desc`;
      } else {
        newSorts.splice(existingIndex, 1);
      }
    } else {
      newSorts.push(`${field}_asc`);
    }
    
    setSorts(newSorts);
    if (query) {
      performSearch(query, newSorts);
    } else {
      fetchProducts(newSorts);
    }
  };

  const handleShowAll = () => {
    setQuery('');
    setSuggestions([]);
    setSpellCheck(null);
    setSelectedBrands([]);
    setSelectedTypes([]);
    setSorts([]);
    fetchProducts([], [], []);
  };

  const handleInputChange = async (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 1) {
      try {
        const res = await axios.get(`http://localhost:8080/api/autocomplete`, {
          params: { prefix: val }
        });
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

  const handleBrandToggle = (brand) => {
    let newBrands;
    if (selectedBrands.includes(brand)) {
      newBrands = selectedBrands.filter(b => b !== brand);
    } else {
      newBrands = [...selectedBrands, brand];
    }
    setSelectedBrands(newBrands);
    
    if (query) {
      performSearch(query, sorts, newBrands);
    } else {
      fetchProducts(sorts, newBrands);
    }
  };

  const handleTypeToggle = (type) => {
    let newTypes;
    if (selectedTypes.includes(type)) {
      newTypes = selectedTypes.filter(t => t !== type);
    } else {
      newTypes = [...selectedTypes, type];
    }
    setSelectedTypes(newTypes);
    
    if (query) {
      performSearch(query, sorts, selectedBrands, newTypes);
    } else {
      fetchProducts(sorts, selectedBrands, newTypes);
    }
  };

  const handleLoginSuccess = (username) => {
    setUser(username);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = (extraClass = '') => (
    <div className={`pagination ${extraClass}`}>
      <button 
        onClick={() => paginate(currentPage - 1)} 
        disabled={currentPage === 1}
        className="page-nav-btn"
      >
        Previous
      </button>
      
      <span className="page-info">
        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
      </span>

      <button 
        onClick={() => paginate(currentPage + 1)} 
        disabled={currentPage === totalPages}
        className="page-nav-btn"
      >
        Next
      </button>

      <div className="page-jump">
        <span>Jump to:</span>
        <select 
          value={currentPage} 
          onChange={(e) => paginate(Number(e.target.value))}
        >
          {[...Array(totalPages)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className={`App-header ${showNav ? '' : 'hidden'}`}>
        <h1>Toothbrush Analyzer</h1>
        <div className="search-container">
          <button className="show-all-btn" onClick={handleShowAll}>All</button>
          
          <div className="custom-select" ref={brandRef}>
            <div className="select-selected" onClick={() => setIsBrandOpen(!isBrandOpen)}>
              {selectedBrands.length > 0 ? `${selectedBrands.length} Brands` : 'Brands: All'}
            </div>
            {isBrandOpen && (
              <div className="select-items brand-select-items">
                {brands.map((brand) => (
                  <div 
                    key={brand} 
                    className="brand-option"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBrandToggle(brand);
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedBrands.includes(brand)} 
                      readOnly 
                    />
                    <span>{brand}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="custom-select" ref={typeRef}>
            <div className="select-selected" onClick={() => setIsTypeOpen(!isTypeOpen)}>
              {selectedTypes.length > 0 ? `${selectedTypes.length} Types` : 'Types: All'}
            </div>
            {isTypeOpen && (
              <div className="select-items brand-select-items">
                {types.map((type) => (
                  <div 
                    key={type} 
                    className="brand-option"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTypeToggle(type);
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedTypes.includes(type)} 
                      readOnly 
                    />
                    <span>{type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sort-buttons-group">
            <button 
              className={`sort-btn ${sorts.some(s => s.startsWith('price')) ? 'active' : ''}`}
              onClick={() => toggleSort('price')}
              title="Sort by Price"
            >
              Price {sorts.find(s => s.startsWith('price'))?.endsWith('_asc') ? '↑' : sorts.find(s => s.startsWith('price'))?.endsWith('_desc') ? '↓' : ''}
              {sorts.findIndex(s => s.startsWith('price')) !== -1 && sorts.length > 1 && <span className="sort-priority">{sorts.findIndex(s => s.startsWith('price')) + 1}</span>}
            </button>
            <button 
              className={`sort-btn ${sorts.some(s => s.startsWith('battery')) ? 'active' : ''}`}
              onClick={() => toggleSort('battery')}
              title="Sort by Battery Life"
            >
              Battery {sorts.find(s => s.startsWith('battery'))?.endsWith('_asc') ? '↑' : sorts.find(s => s.startsWith('battery'))?.endsWith('_desc') ? '↓' : ''}
              {sorts.findIndex(s => s.startsWith('battery')) !== -1 && sorts.length > 1 && <span className="sort-priority">{sorts.findIndex(s => s.startsWith('battery')) + 1}</span>}
            </button>
            <button 
              className={`sort-btn ${sorts.some(s => s.startsWith('waterproof')) ? 'active' : ''}`}
              onClick={() => toggleSort('waterproof')}
              title="Sort by Waterproof Rating"
            >
              Waterproof {sorts.find(s => s.startsWith('waterproof'))?.endsWith('_asc') ? '↑' : sorts.find(s => s.startsWith('waterproof'))?.endsWith('_desc') ? '↓' : ''}
              {sorts.findIndex(s => s.startsWith('waterproof')) !== -1 && sorts.length > 1 && <span className="sort-priority">{sorts.findIndex(s => s.startsWith('waterproof')) + 1}</span>}
            </button>
          </div>

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
          
          <div className="auth-container">
            {user ? (
              <div className="user-info">
                <span>Welcome, {user}</span>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <button className="login-btn" onClick={() => setShowLoginModal(true)}>Login / Register</button>
            )}
          </div>
        </div>
        {!loading && products.length > 0 && renderPagination('header-pagination')}
      </header>

      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)} 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}

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
          <div className="main-column">
            <div className="product-list">
              {loading ? (
                <p>Loading...</p>
              ) : products.length === 0 ? (
                <div className="no-results">
                  <h3>No results found</h3>
                  <p>Please try a different keyword or check your spelling.</p>
                </div>
              ) : (
                currentItems.map((p, i) => (
                  <div key={i} className="product-card">
                    <img src={p.imageUrl} alt={p.name} />
                    <div className="product-info">
                      <h3>{p.name}</h3>
                      <p className="brand">{p.brand}</p>
                      <div className="product-specs">
                        {p.toothbrushType && <span className="spec-tag type">{p.toothbrushType}</span>}
                        {p.batteryLife && <span className="spec-tag battery">{p.batteryLife} Days</span>}
                        {p.waterproofRating && <span className="spec-tag waterproof">{p.waterproofRating}</span>}
                      </div>
                      <p className="price">{p.price}</p>
                      {p.rating !== "0.0" && <p className="rating">Rating: {p.rating} ({p.reviewCount} reviews)</p>}
                      {p.description && <p className="desc">{p.description.substring(0, 100)}...</p>}
                      <a href={p.productUrl} target="_blank" rel="noreferrer">View Product</a>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {!loading && products.length > 0 && renderPagination()}
          </div>

          <aside className={`sidebar ${showNav ? '' : 'move-up'}`}>
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
