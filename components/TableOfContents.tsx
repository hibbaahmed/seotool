'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Parse content to extract headings
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    
    const items: TocItem[] = Array.from(headings).map((heading, index) => {
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName.substring(1));
      // Create a clean ID from the text
      let id = text.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      // Ensure the heading has an ID for linking
      heading.id = id || `heading-${index}`;
      
      return {
        id: heading.id,
        text,
        level
      };
    });
    
    setTocItems(items);
    
    // Set up intersection observer for active section tracking
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -80% 0px',
        threshold: 0
      }
    );

    // Observe all headings in the actual rendered content
    setTimeout(() => {
      const renderedHeadings = document.querySelectorAll('article h2, article h3');
      renderedHeadings.forEach((heading) => observer.observe(heading));
    }, 500);

    return () => observer.disconnect();
  }, [content]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className="hidden lg:block">
      {/* Toggle button for mobile */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="lg:hidden fixed top-24 right-4 z-50 p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Toggle table of contents"
      >
        <List className="w-5 h-5 text-gray-700" />
      </button>

      {/* TOC Sidebar */}
      <aside
        className={`
          fixed top-32 right-8 w-64 max-h-[calc(100vh-200px)] overflow-y-auto
          bg-white rounded-xl shadow-lg border border-gray-200 p-6
          transition-all duration-300 ease-in-out
          ${isVisible ? 'translate-x-0' : 'lg:translate-x-0 translate-x-[calc(100%+2rem)]'}
        `}
      >
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
          <List className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
            Table of Contents
          </h3>
        </div>

        <nav>
          <ul className="space-y-2">
            {tocItems.map((item, index) => (
              <li key={`${item.id}-${index}`}>
                <button
                  onClick={() => scrollToHeading(item.id)}
                  className={`
                    w-full text-left text-sm transition-all duration-200 py-1.5 px-2 rounded-md
                    ${item.level === 3 ? 'pl-5 text-xs' : 'font-medium'}
                    ${activeId === item.id 
                      ? 'text-blue-600 bg-blue-50 border-l-2 border-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-2 border-transparent'
                    }
                  `}
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Progress indicator */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">Reading Progress</div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${tocItems.length > 0 ? ((tocItems.findIndex(item => item.id === activeId) + 1) / tocItems.length) * 100 : 0}%`
              }}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

