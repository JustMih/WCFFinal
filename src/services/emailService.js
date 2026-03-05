const nodemailer = require('nodemailer');

// Primary SMTP configuration (WCF Server)
const primaryConfig = {
    host: '196.192.79.145',
    port: 25,
    secure: false,
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    logger: true,
    debug: true
};

// Fallback SMTP configuration (Gmail)
const fallbackConfig = {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER || 'your-email@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
    },
    tls: {
        rejectUnauthorized: false
    }
};

// Create transporters
const primaryTransporter = nodemailer.createTransport(primaryConfig);
const fallbackTransporter = nodemailer.createTransport(fallbackConfig);

// Verify connection configuration
const verifyConnection = async (transporter) => {
    try {
        await transporter.verify();
        console.log('SMTP connection verified successfully');
        return true;
    } catch (error) {
        console.error('SMTP connection verification failed:', error);
        return false;
    }
};

// Email templates for different ticket categories
const emailTemplates = {
    complaints: {
        subject: 'New Complaint Ticket Created',
        body: (ticket) => `
            A new complaint ticket has been created:
            Ticket ID: ${ticket.id}
            Subject: ${ticket.subject}
            Category: ${ticket.category}
            Description: ${ticket.description}
            Created By: ${ticket.createdBy?.name || 'N/A'}
            Priority: ${ticket.complaint_type || 'N/A'}
        `
    },
    suggestions: {
        subject: 'New Suggestion Ticket Created',
        body: (ticket) => `
            A new suggestion ticket has been created:
            Ticket ID: ${ticket.id}
            Subject: ${ticket.subject}
            Category: ${ticket.category}
            Description: ${ticket.description}
            Created By: ${ticket.createdBy?.name || 'N/A'}
        `
    },
    complements: {
        subject: 'New Complement Ticket Created',
        body: (ticket) => `
            A new complement ticket has been created:
            Ticket ID: ${ticket.id}
            Subject: ${ticket.subject}
            Category: ${ticket.category}
            Description: ${ticket.description}
            Created By: ${ticket.createdBy?.name || 'N/A'}
        `
    }
};

// Function to send email with fallback
const sendTicketEmail = async (ticket, recipientEmail) => {
    const category = ticket.category.toLowerCase();
    const template = emailTemplates[category] || emailTemplates.complaints;

    const mailOptions = {
        from: 'wcf-notification@wcf.go.tz',
        to: recipientEmail,
        subject: template.subject,
        text: template.body(ticket)
    };

    // Try primary SMTP first
    try {
        console.log('Attempting to send email using primary SMTP...');
        const isPrimaryConnected = await verifyConnection(primaryTransporter);
        
        if (isPrimaryConnected) {
            const info = await primaryTransporter.sendMail(mailOptions);
            console.log('Email sent successfully using primary SMTP:', info.response);
            return true;
        }
    } catch (primaryError) {
        console.error('Primary SMTP failed:', primaryError.message);
    }

    // Try fallback SMTP if primary fails
    try {
        console.log('Attempting to send email using fallback SMTP...');
        const isFallbackConnected = await verifyConnection(fallbackTransporter);
        
        if (isFallbackConnected) {
            // Update from address for Gmail
            mailOptions.from = process.env.GMAIL_USER || 'your-email@gmail.com';
            const info = await fallbackTransporter.sendMail(mailOptions);
            console.log('Email sent successfully using fallback SMTP:', info.response);
            return true;
        }
    } catch (fallbackError) {
        console.error('Fallback SMTP failed:', fallbackError.message);
    }

    console.error('❌ Failed to send email using both primary and fallback SMTP');
    return false;
};

// Function to get reviewer email based on ticket category
const getReviewerEmail = async (category) => {
  // This should be replaced with actual logic to fetch reviewer email from your database
  return 'reviewer@wcf.go.tz';
};

module.exports = {
    sendTicketEmail,
    getReviewerEmail,
    verifyConnection
}; 