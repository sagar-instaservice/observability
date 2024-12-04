const express = require('express');
const prometheus = require('prom-client');
const app = express();
const port = 3000;

// Create a registry to store metrics
const register = new prometheus.Registry();

// Define custom metrics to track API requests
const requestCounter = new prometheus.Counter({
  name: 'requests_total',
  help: 'Total number of API requests',
  labelNames: ['service_name','env','api_name', 'status_code'],
});

const apiDurationHistogram = new prometheus.Histogram({
  name: 'duration_seconds',
  help: 'Histogram of API request durations in seconds',
  labelNames: ['service_name','env','api_name'],
});

// New metrics for response errors
const errorCounter = new prometheus.Counter({
  name: 'errors_total',
  help: 'Total number of API errors (4xx and 5xx)',
  labelNames: ['service_name','env','api_name', 'error_type'],
});

// Register the metrics
register.registerMetric(requestCounter);
register.registerMetric(apiDurationHistogram);
register.registerMetric(errorCounter);

// Middleware to record API request counts, durations, response sizes, and errors
app.use((req, res, next) => {
  console.log("in metrics calc");
  const start = Date.now();
  
  // Set up a listener for the 'finish' event to track request completion
  res.on('finish', () => {
    const durationInSeconds = (Date.now() - start) / 1000;

    // Increment the request counter with labels
    requestCounter.labels( "account-service","prod",req.originalUrl, res.statusCode).inc();

    // Record the duration in the histogram
    apiDurationHistogram.labels( "account-service","prod",req.originalUrl).observe(durationInSeconds);


    // Track error rates for 4xx and 5xx responses
    if (res.statusCode >= 400 && res.statusCode < 500) {
      errorCounter.labels( req.originalUrl, '4xx').inc();
    } else if (res.statusCode >= 500) {
      errorCounter.labels( "account-service","prod",req.originalUrl, '5xx').inc();
    }
    console.log("in metrics calc- end");
  });

  next();
});

// Sample API endpoints
app.get('/accounts', (req, res) => {
  res.send('Hello from accounts!');   
});

app.get('/booking', (req, res) => {
  res.send('Hello from booking!');
});

app.get('/customer', (req, res) => {
  console.log("before");

  res.send('Hello from customer!');


});


app.get('/', async(req, res) => {
  res.send('up');
});


// Expose Prometheus metrics at /metrics endpoint
app.get('/metrics', async (req, res) => {
  console.log("metrics pull triggered");
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});


// Start the Express server
app.listen(port, () => {
  console.log(`Node.js app listening at http://localhost:${port}`);
});

