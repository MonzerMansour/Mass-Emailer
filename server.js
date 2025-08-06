const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from current directory

// Email preparation endpoint
app.post('/prepare-emails', async (req, res) => {
    try {
        const { subject, message, recipients } = req.body;

        // Validate required fields
        if (!subject || !message || !recipients) {
            return res.status(400).json({
                success: false,
                message: 'Subject, message, and recipients are required'
            });
        }

        // Parse recipients string into array of {name, email} objects
        const recipientList = recipients.split(',').map(recipient => {
            const trimmed = recipient.trim();
            const match = trimmed.match(/^(.+?)\s+([^\s]+@[^\s]+)$/);

            if (!match) {
                throw new Error(`Invalid recipient format: ${trimmed}`);
            }

            return {
                name: match[1].trim(),
                email: match[2].trim()
            };
        });

        // Create Gmail compose URLs for each recipient
        const emailUrls = recipientList.map(recipient => {
            // Personalize message by replacing {name} with actual name
            const personalizedMessage = message.replace(/{name}/g, recipient.name);

            // Create Gmail compose URL
            const gmailUrl = new URL('https://mail.google.com/mail/?view=cm&fs=1');
            gmailUrl.searchParams.set('to', recipient.email);
            gmailUrl.searchParams.set('su', subject);
            gmailUrl.searchParams.set('body', personalizedMessage);

            return {
                name: recipient.name,
                email: recipient.email,
                url: gmailUrl.toString(),
                personalizedMessage: personalizedMessage
            };
        });

        res.json({
            success: true,
            message: `Prepared ${emailUrls.length} emails`,
            emails: emailUrls,
            summary: {
                total: recipientList.length
            }
        });
    } catch (error) {
        console.error('Email preparation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running', port: PORT });
});

app.listen(PORT, () => {
    console.log(`Email preparation server running on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/index.html in your browser`);
});