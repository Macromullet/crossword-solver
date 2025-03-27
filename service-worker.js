/*
 * Copyright (c) 2025 Brooke Philpott
 * 
 * This file is part of the Crossword Solver application.
 * Licensed under the MIT License. See LICENSE.md for details.
 */

const CACHE_NAME = 'crossword-solver-v1';

// Files to cache for offline use
const filesToCache = [
    '/',
    '/index.html',
    '/app.js',
    '/dictionary.js',
    '/dictionary.txt',
    '/manifest.json',
    '/css/main.css',
    '/css/base/base.css',
    '/css/components/loading.css',
    '/css/components/controls.css',
    '/css/components/word-input.css',
    '/css/components/results.css',
    '/css/components/accessibility.css',
    '/css/themes/newspaper-theme.css',
    '/css/themes/modern-theme.css',
    '/css/themes/silly-theme.css',
    '/js/accessibility.js'
];

// Install service worker and cache all content
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(filesToCache);
            })
    );
});

// Intercept fetch requests
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                
                // Clone the request because it's a one-time use stream
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then(
                    function(response) {
                        // Check if we received a valid response
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response because it's a one-time use stream
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                // Add response to cache for future offline use
                                cache.put(event.request, responseToCache);
                            });
                            
                        return response;
                    }
                );
            })
    );
});

// Update caches when a new service worker activates
self.addEventListener('activate', function(event) {
    const cacheWhitelist = [CACHE_NAME];
    
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    // Delete old caches that aren't in the whitelist
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});