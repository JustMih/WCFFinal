import React, { useState } from 'react';
import axios from 'axios';

const SearchMember = ({ onResultSelect, type = 'employee' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        if (!searchTerm) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post('https://demomspapi.wcf.go.tz/api/v1/search/details', {
                type: type,
                name: searchTerm,
                employer_registration_number: ''
            });

            if (response.data.results) {
                setSearchResults(response.data.results);
            }
        } catch (err) {
            setError('Error fetching search results. Please try again.');
            console.error('Search error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (result) => {
        onResultSelect(result);
        setSearchResults([]); // Clear results after selection
        setSearchTerm(''); // Clear search term
    };

    return (
        <div className="search-member">
            <div className="search-input-container">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Search ${type} by name...`}
                    className="search-input"
                />
                <button 
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="search-button"
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {searchResults.length > 0 && (
                <div className="search-results">
                    {searchResults.map((result) => (
                        <div 
                            key={result.id}
                            className="search-result-item"
                            onClick={() => handleSelect(result)}
                        >
                            <div className="result-name">{result.name}</div>
                            <div className="result-member-no">Member No: {result.memberno}</div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .search-member {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .search-input-container {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .search-input {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .search-button {
                    padding: 8px 16px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .search-button:disabled {
                    background-color: #ccc;
                }

                .search-results {
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    max-height: 300px;
                    overflow-y: auto;
                }

                .search-result-item {
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                    cursor: pointer;
                }

                .search-result-item:hover {
                    background-color: #f5f5f5;
                }

                .result-name {
                    font-weight: bold;
                    margin-bottom: 4px;
                }

                .result-member-no {
                    font-size: 12px;
                    color: #666;
                }

                .error-message {
                    color: red;
                    margin: 10px 0;
                }
            `}</style>
        </div>
    );
};

export default SearchMember; 