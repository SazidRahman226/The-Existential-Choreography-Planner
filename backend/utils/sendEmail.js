import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail', // Default to Gmail
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // 2. Define the email options
    const mailOptions = {
        from: `Existential Planner <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.message
    };

    // 3. Send the email
    await transporter.sendMail(mailOptions);
};

export default sendEmail;
