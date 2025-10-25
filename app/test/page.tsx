"use client"
import React, { useState, useEffect } from 'react';

const TestPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.log('Fetching posts...');
        const response = await fetch('/api/wordpress/posts?limit=2');
        console.log('Response:', response);
        const data = await response.json();
        console.log('Data:', data);
        
        if (response.ok && data.posts) {
          setPosts(data.posts);
          setLoading(false);
        } else {
          setError(data.error || 'Failed to fetch posts');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Network error');
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Test Page</h1>
      <p>Posts count: {posts.length}</p>
      {posts.map((post: any) => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </div>
      ))}
    </div>
  );
};

export default TestPage;
