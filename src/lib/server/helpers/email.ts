import { SMTP_HOST, SMTP_PASSWORD, SMTP_USERNAME } from '$env/static/private';
import nodemailer from 'nodemailer';
import type { MailOptions } from 'nodemailer/lib/json-transport';

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
        user: SMTP_USERNAME,
        pass: SMTP_PASSWORD,
    },
});

export const sendEmail = async (mailOptions: MailOptions) => {
    return await transporter.sendMail(mailOptions);
};        