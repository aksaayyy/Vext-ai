// Simple test to see if we can require the service
try {
  const service = require('./src/lib/intelligence/service');
  console.log('Service loaded successfully');
  console.log('Service object:', typeof service);
} catch (error) {
  console.error('Error loading service:', error.message);
}