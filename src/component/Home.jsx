import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Book, User, Calendar, Star, ExternalLink, Filter, X, Loader2, Globe, BookOpen, Eye, Heart, Sparkles } from 'lucide-react';

const BookFinder = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('title');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    language: '',
    publishYear: '',
    subject: ''
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalBooks, setTotalBooks] = useState(0);
  const debounceTimer = useRef(null);
  const observer = useRef(null);
  const loadMoreTrigger = useRef(null);

  // Load favorites from memory on component mount
  useEffect(() => {
    const savedFavorites = [];
    setFavorites(savedFavorites);
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback((query) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      if (query.trim()) {
        performSearch(query, 0, true);
      }
    }, 500);
  }, []);

  // Effect for auto-search on query change
  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    } else {
      setBooks([]);
      setHasMore(false);
      setTotalBooks(0);
    }
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, debouncedSearch]);

  // Infinite scroll setup
  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreBooks();
        }
      },
      { threshold: 1.0 }
    );
    
    if (loadMoreTrigger.current) {
      observer.current.observe(loadMoreTrigger.current);
    }
    
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [hasMore, loadingMore, loading]);

  const performSearch = async (query = searchQuery, page = 0, isNewSearch = false) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }

    if (isNewSearch) {
      setLoading(true);
      setBooks([]);
      setCurrentPage(0);
    } else {
      setLoadingMore(true);
    }
    
    setError('');

    try {
      let url = `https://openlibrary.org/search.json?`;
      
      switch (searchType) {
        case 'title':
          url += `title=${encodeURIComponent(query)}`;
          break;
        case 'author':
          url += `author=${encodeURIComponent(query)}`;
          break;
        case 'subject':
          url += `subject=${encodeURIComponent(query)}`;
          break;
        case 'isbn':
          url += `isbn=${encodeURIComponent(query)}`;
          break;
        default:
          url += `q=${encodeURIComponent(query)}`;
      }

      if (filters.language) url += `&language=${filters.language}`;
      if (filters.publishYear) url += `&first_publish_year=${filters.publishYear}`;

      const limit = 20;
      url += `&limit=${limit}&offset=${page * limit}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }

      const data = await response.json();
      
      if (data.docs) {
        setTotalBooks(data.numFound || 0);
        
        if (isNewSearch) {
          setBooks(data.docs);
        } else {
          setBooks(prevBooks => [...prevBooks, ...data.docs]);
        }
        
        setCurrentPage(page);
        setHasMore(data.docs.length === limit && (page + 1) * limit < (data.numFound || 0));
        
        if (data.docs.length === 0 && isNewSearch) {
          setError('No books found matching your search criteria');
        }
      } else {
        if (isNewSearch) setError('No books found matching your search criteria');
      }
    } catch (err) {
      setError('Failed to search books. Please check your internet connection and try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreBooks = () => {
    if (hasMore && !loadingMore && !loading) {
      performSearch(searchQuery, currentPage + 1, false);
    }
  };

  const searchBooks = () => {
    performSearch(searchQuery, 0, true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchBooks();
    }
  };

  const toggleFavorite = (book) => {
    const isAlreadyFavorite = favorites.some(fav => fav.key === book.key);
    if (isAlreadyFavorite) {
      setFavorites(favorites.filter(fav => fav.key !== book.key));
    } else {
      setFavorites([...favorites, book]);
    }
  };

  const isFavorite = (book) => {
    return favorites.some(fav => fav.key === book.key);
  };

  const getCoverImageUrl = (book) => {
    if (book.cover_i) {
      return `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
    }
    return null;
  };

  const BookCard = ({ book }) => (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl
     shadow-lg hover:shadow-2xl transition-all duration-500
      p-6 hover:scale-[1.02] border border-white/20 relative overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-blue-50/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 flex gap-4">
        <div className="relative">
          {getCoverImageUrl(book) ? (
            <img
              src={getCoverImageUrl(book)}
              alt={book.title}
              className="w-20 h-28 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-20 h-28 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center shadow-md">
              <Book className="w-8 h-8 text-indigo-400" />
            </div>
          )}
          {book.has_fulltext && (
            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full">
              <Eye className="w-3 h-3" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 font-serif leading-tight">
              {book.title}
            </h3>
            <button
              onClick={() => toggleFavorite(book)}
              className={`ml-2 p-2 rounded-full transition-all duration-300 ${
                isFavorite(book) 
                  ? 'text-rose-500 bg-rose-50 hover:bg-rose-100 scale-110' 
                  : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite(book) ? 'fill-current' : ''}`} />
            </button>
          </div>
          
          {book.author_name && (
            <div className="flex items-center text-gray-600 mb-2">
              <User className="w-4 h-4 mr-2 text-indigo-400" />
              <span className="text-sm font-medium">{book.author_name.join(', ')}</span>
            </div>
          )}
          
          <div className="flex items-center gap-4 text-gray-600 mb-3 text-sm">
            {book.first_publish_year && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-blue-400" />
                <span className="font-medium">{book.first_publish_year}</span>
              </div>
            )}
            
            {book.edition_count && (
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1 text-purple-400" />
                <span className="font-medium">{book.edition_count} editions</span>
              </div>
            )}
          </div>
          
          {book.language && book.language.length > 0 && (
            <div className="flex items-center text-gray-600 mb-3">
              <Globe className="w-4 h-4 mr-2 text-emerald-400" />
              <span className="text-sm font-medium">
                {book.language.slice(0, 3).join(', ')}
                {book.language.length > 3 && ` +${book.language.length - 3} more`}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-4">
            {book.has_fulltext && (
              <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium">
                <Eye className="w-3 h-3" />
                Full Text
              </span>
            )}
            
            {book.ebook_access === 'public' && (
              <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                Free eBook
              </span>
            )}
            
            {book.public_scan_b && (
              <span className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-medium">
                Public Scan
              </span>
            )}
          </div>
          
          {book.subject && book.subject.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {book.subject.slice(0, 3).map((subject, index) => (
                  <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg font-medium">
                    {subject}
                  </span>
                ))}
                {book.subject.length > 3 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{book.subject.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setSelectedBook(book)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              View Details
            </button>
            {book.key && (
              <a
                href={`https://openlibrary.org${book.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center gap-1 shadow-sm hover:shadow-md"
              >
                <ExternalLink className="w-3 h-3" />
                Open Library
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const BookModal = ({ book, onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-300">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/20">
        <div className="p-8 overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-3xl font-bold text-gray-900 font-serif leading-tight pr-4">{book.title}</h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex gap-8 mb-8">
            {getCoverImageUrl(book) && (
              <div className="flex-shrink-0">
                <img
                  src={getCoverImageUrl(book)}
                  alt={book.title}
                  className="w-40 h-56 object-cover rounded-2xl shadow-lg"
                />
              </div>
            )}
            
            <div className="flex-1">
              {book.author_name && (
                <p className="mb-3 text-gray-700"><span className="font-bold text-indigo-600">Author(s):</span> <span className="font-medium">{book.author_name.join(', ')}</span></p>
              )}
              {book.first_publish_year && (
                <p className="mb-3 text-gray-700"><span className="font-bold text-blue-600">First Published:</span> <span className="font-medium">{book.first_publish_year}</span></p>
              )}
              {book.publisher && (
                <p className="mb-3 text-gray-700"><span className="font-bold text-purple-600">Publisher(s):</span> <span className="font-medium">{book.publisher.slice(0, 3).join(', ')}</span></p>
              )}
              {book.language && (
                <p className="mb-3 text-gray-700"><span className="font-bold text-emerald-600">Languages:</span> <span className="font-medium">{book.language.join(', ')}</span></p>
              )}
              {book.edition_count && (
                <p className="mb-3 text-gray-700"><span className="font-bold text-rose-600">Editions:</span> <span className="font-medium">{book.edition_count}</span></p>
              )}
              {book.has_fulltext && (
                <p className="mb-3 text-gray-700"><span className="font-bold text-green-600">Full Text Available:</span> <span className="font-medium">Yes</span></p>
              )}
              {book.ebook_access === 'public' && (
                <p className="mb-3 text-gray-700"><span className="font-bold text-cyan-600">eBook Access:</span> <span className="font-medium">Public (Free)</span></p>
              )}
              {book.ia && book.ia.length > 0 && (
                <p className="mb-3 text-gray-700"><span className="font-bold text-orange-600">Archive Copies:</span> <span className="font-medium">{book.ia.length} available</span></p>
              )}
            </div>
          </div>
          
          {book.subject && book.subject.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Subjects:</h3>
              <div className="flex flex-wrap gap-2">
                {book.subject.slice(0, 15).map((subject, index) => (
                  <span key={index} className="bg-gradient-to-r from-blue-100 to-purple-100 text-gray-700 text-sm px-3 py-2 rounded-xl font-medium border border-white/50">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={() => toggleFavorite(book)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                isFavorite(book)
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite(book) ? 'fill-current' : ''}`} />
              {isFavorite(book) ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
            {book.key && (
              <a
                href={`https://openlibrary.org${book.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-blue-700 transition-all duration-300 inline-flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
              >
                <ExternalLink className="w-4 h-4" />
                View on Open Library
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-indigo-500 mr-2" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent font-serif">
              Book Finder
            </h1>
            <Sparkles className="w-8 h-8 text-indigo-500 ml-2" />
          </div>
          <p className="text-xl text-gray-600 font-medium">Discover your next literary adventure</p>
        </div>

        {/* Search Section */}
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search for books... (auto-search enabled)"
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-400 bg-white/80 backdrop-blur-sm text-gray-800 font-medium placeholder-gray-500 transition-all duration-300"
                />
              </div>
            </div>
            
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-400 bg-white/80 backdrop-blur-sm font-medium text-gray-700 transition-all duration-300"
            >
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="subject">Subject</option>
              <option value="isbn">ISBN</option>
              <option value="general">General</option>
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                showFilters 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg' 
                  : 'bg-white/80 text-gray-700 hover:bg-white border-2 border-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            
            <button
              onClick={searchBooks}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all duration-300 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Search
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border-t-2 border-gray-200 pt-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Language</label>
                  <select
                    value={filters.language}
                    onChange={(e) => setFilters({...filters, language: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-400 bg-white/80 font-medium"
                  >
                    <option value="">Any Language</option>
                    <option value="eng">English</option>
                    <option value="spa">Spanish</option>
                    <option value="fre">French</option>
                    <option value="ger">German</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Publish Year</label>
                  <input
                    type="number"
                    value={filters.publishYear}
                    onChange={(e) => setFilters({...filters, publishYear: e.target.value})}
                    placeholder="e.g., 2020"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-400 bg-white/80 font-medium"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({language: '', publishYear: '', subject: ''})}
                    className="w-full px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl hover:from-gray-300 hover:to-gray-400 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif flex items-center gap-2">
              <Heart className="w-8 h-8 text-rose-500 fill-current" />
              Your Favorites ({favorites.length})
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {favorites.slice(0, 3).map((book) => (
                <BookCard key={book.key} book={book} />
              ))}
            </div>
            {favorites.length > 3 && (
              <p className="text-gray-600 mt-4 font-medium">And {favorites.length - 3} more favorites...</p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-2xl mb-6 shadow-md">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-6">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
            <p className="text-xl text-gray-600 font-semibold">Searching for books...</p>
            <p className="text-gray-500 mt-2">Finding your next great read</p>
          </div>
        )}

        {/* Results */}
        {books.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif">
              Search Results 
              <span className="text-indigo-600"> ({totalBooks.toLocaleString()} books found)</span>
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              {books.map((book, index) => (
                <BookCard key={`${book.key}-${index}`} book={book} />
              ))}
            </div>
            
            {/* Infinite scroll trigger */}
            <div ref={loadMoreTrigger} className="py-12">
              {loadingMore && (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                  <p className="text-lg text-gray-600 font-semibold">Loading more books...</p>
                </div>
              )}
              
              {!hasMore && books.length >= 20 && (
                <div className="text-center text-gray-600 bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-md">
                  <p className="text-lg font-semibold mb-2">You've reached the end of the results! 🎉</p>
                  <p className="text-sm font-medium">Showing all {books.length} books</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Book Detail Modal */}
        {selectedBook && (
          <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
        )}
      </div>
    </div>
  );
};

export default BookFinder;