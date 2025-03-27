/*
 * Copyright (c) 2025 Brooke Philpott
 * 
 * This file is part of the Crossword Solver application.
 * Licensed under the MIT License. See LICENSE.md for details.
 */
const CACHE_NAME = 'crossword-solver-v4';

// Files to cache only for offline support
const filesToCache = [
    '/dictionary.txt', // Only cache the dictionary data and other static assets
    '/manifest.json',
    '/icons/icon.svg',
    '/icons/icon-192x192.png'
];

// Critical assets that should be cached but checked for updates frequently
const dynamicAssets = [
    '/',
    '/index.html',
    '/app.js',
    '/dictionary.js',
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
    '/css/themes/google-theme.css',
    '/css/themes/apple-theme.css',
    '/css/themes/microsoft-theme.css',
    '/js/accessibility.js'
];

// Install service worker and cache static content
self.addEventListener('install', function(event) {
    console.log('Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Caching static assets for offline support');
                return cache.addAll(filesToCache);
            })
    );
});

// Use a network-first strategy for dynamic content
self.addEventListener('fetch', function(event) {
    const url = new URL(event.request.url);
    const isDynamicAsset = dynamicAssets.some(asset => 
        url.pathname.endsWith(asset) || url.pathname === asset
    );
    
    // For HTML, CSS, JS files - use network first strategy
    if (isDynamicAsset || 
        url.pathname.endsWith('.html') || 
        url.pathname.endsWith('.css') || 
        url.pathname.endsWith('.js')) {
        
        event.respondWith(
            fetch(event.request)
                .then(function(response) {
                    // Cache the updated version in the background
                    if (response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });
                    }
                    return response;
                })
                .catch(function() {
                    // If network fails, try to serve from cache
                    return caches.match(event.request);
                })
        );
    } 
    // For other assets like images and the dictionary - try cache first, then network
    else {
        event.respondWith(
            caches.match(event.request)
                .then(function(response) {
                    // Return cache hit if available
                    if (response) {
                        return response;
                    }
                    
                    // Otherwise fetch from network
                    return fetch(event.request).then(
                        function(response) {
                            if(!response || response.status !== 200) {
                                return response;
                            }
                            
                            // Update cache with new response
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then(function(cache) {
                                    cache.put(event.request, responseToCache);
                                });
                                
                            return response;
                        }
                    );
                })
        );
    }
});

// Clear outdated caches
self.addEventListener('activate', function(event) {
    console.log('Activating new service worker...');
    const cacheWhitelist = [CACHE_NAME];
    
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting outdated cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});